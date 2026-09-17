import { redirect } from 'next/navigation';

/**
 * /login is deprecated — login form is now served at the root URL /.
 * Permanently redirect any visitor of /login back to /.
 */
export default function LoginRedirectPage() {
  redirect('/');
}
