import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Le mot de passe est requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user from Supabase Auth session (set by the password reset link)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { error: 'Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.' },
        { status: 400 }
      );
    }

    // Find the user in our custom users table by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', authUser.email)
      .maybeSingle();

    if (findError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Update password in Supabase Auth (this handles the session)
    const { error: updateAuthError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateAuthError) {
      console.error('Supabase Auth password update error:', updateAuthError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      );
    }

    // Also update password_hash in our custom users table
    const passwordHash = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Users table password update error:', updateError);
      // Password was updated in Supabase Auth, so we'll still return success
    }

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès',
    });
  } catch (error: any) {
    console.error('Reset password catch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}
