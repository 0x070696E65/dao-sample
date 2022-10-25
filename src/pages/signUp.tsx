import type { NextPage } from 'next';
import { UserData } from '../shared/types';
import { useState, ChangeEvent, useEffect } from 'react';
import { signUpContract } from '../shared/lib/contracts';
import { getActiveAddress, getActivePublicKey, isAllowedSSS } from 'sss-module';
import Link from 'next/link';

const SignUp: NextPage = () => {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    address: '',
    publicKey: '',
  });
  useEffect(() => {
    const init = async () => {
      setTimeout(async () => {
        if (!isAllowedSSS()) {
          alert('SSS Extensionをインストールし有効化してください');
        } else {
          const user: UserData = {
            name: '',
            address: getActiveAddress(),
            publicKey: getActivePublicKey(),
          };
          setFormData(user);
        }
      }, 500);
    };
    init();
  }, []);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const signUp = async function () {
    const result = await signUpContract(formData);
    console.log(result);
  };
  return (
    <div>
      <h2>Sign Up</h2>
      <div>
        <label>user name</label>
        <input
          type="text"
          name="name"
          onChange={handleChange}
          style={{ marginLeft: '10px', width: '200px' }}
          value={formData.name}
        ></input>
        <br />
        <label>address</label>
        <input
          type="text"
          name="address"
          onChange={handleChange}
          style={{ marginLeft: '10px', width: '350px' }}
          value={formData.address}
        ></input>
        <br />
        <label>public key</label>
        <input
          type="text"
          name="publicKey"
          onChange={handleChange}
          style={{ marginLeft: '10px', width: '510px' }}
          value={formData.publicKey}
        ></input>
        <br />
        <input type="button" value="sign up" onClick={signUp}></input>
      </div>
      <p>
        <Link href={'/sign-in'}>
          <a>Sign In</a>
        </Link>
      </p>
    </div>
  );
};
export default SignUp;
