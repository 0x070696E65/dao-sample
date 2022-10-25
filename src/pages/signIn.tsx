import type { NextPage } from 'next';
import { UserData } from '../shared/types';
import { useState } from 'react';
import { auth } from '../shared/lib/authentication';
import { useCookies } from 'react-cookie';
import Router from 'next/router';
import Link from 'next/link';

const SignIn: NextPage = () => {
  const [error, setError] = useState<string>();
  const [cookies, setCookie] = useCookies();
  if (
    cookies.name != undefined &&
    cookies.address != undefined &&
    cookies.publicKey != undefined
  ) {
    Router.push('/');
  }
  const signIn = async function () {
    try {
      const userData: UserData = await auth();
      setCookie('name', userData.name);
      setCookie('address', userData.address);
      setCookie('publicKey', userData.publicKey);
      Router.push('/');
    } catch {
      setError('アカウントが存在しません');
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      <button onClick={signIn}>signIn</button>
      <p style={{ color: '#FF0000' }}>{error}</p>
      <p>
        <Link href={'/sign-up'}>
          <a>Sign Up</a>
        </Link>
      </p>
    </div>
  );
};
export default SignIn;
