import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'L\'email est requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, check if email exists in the users table
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    // For security, don't reveal if email exists or not
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
      });
    }

    // User exists, send password reset email using Supabase Auth
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${siteUrl}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      console.error('Password reset email error:', resetError);
      // Still return success to prevent email enumeration
      return NextResponse.json({
        message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
      });
    }

    return NextResponse.json({
      message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
    });
  } catch (error: any) {
    console.error('Forgot password catch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de réinitialisation' },
      { status: 500 }
    );
  }
}
