import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const tunisianPhoneRegex = /^\+216\d{8}$/;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { firstName, lastName, email, phone, password } = await request.json();
    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();
    const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').replace(/\s/g, '');

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone || !password) {
      return NextResponse.json(
        { error: 'Nom, prénom, email, téléphone et mot de passe requis' },
        { status: 400 }
      );
    }

    if (!tunisianPhoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone doit être au format +216XXXXXXXX' },
        { status: 400 }
      );
    }

    // Check if a client with this email already exists
    const { data: existingClient, error: existingError } = await supabase
      .from('clients')
      .select('id, email, name, phone, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du client' },
        { status: 500 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // If a client exists without a password yet, upgrade that client to a full account
    if (existingClient && !existingClient.password_hash) {
      const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update({
          name: fullName,
          phone: normalizedPhone,
          password_hash: passwordHash,
        })
        .eq('id', existingClient.id)
        .select()
        .single();

      if (updateError || !updatedClient) {
        return NextResponse.json(
          { error: updateError?.message || 'Erreur lors de la création du compte client' },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        client: {
          id: updatedClient.id,
          name: updatedClient.name,
          email: updatedClient.email,
          phone: updatedClient.phone,
        },
      });

      response.cookies.set('client_id', updatedClient.id, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // If a full account already exists with this email, block signup
    if (existingClient && existingClient.password_hash) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' },
        { status: 409 }
      );
    }

    // No client with this email: create a new one
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: null,
        total_purchases: 0,
        unpaid_amount: 0,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: error?.message || 'Erreur lors de la création du compte client' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
      },
    });

    // Set a separate cookie for client auth
    response.cookies.set('client_id', client.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}

