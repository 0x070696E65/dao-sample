import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { isAllowedSSS } from 'sss-module';
import { UserData } from '../shared/types';
import Router from 'next/router';
import { useCookies } from 'react-cookie';
import { QuestList } from '../components/questList';
const Home: NextPage = () => {
  const [cookies, setCookie, removeCookie] = useCookies();
  const [userData, setUserData] = useState<UserData>({
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
          if (
            cookies.name == undefined ||
            cookies.address == undefined ||
            cookies.publicKey == undefined
          ) {
            Router.push('/sign-in');
          } else {
            setUserData({
              name: cookies.name,
              address: cookies.address,
              publicKey: cookies.publicKey,
            });
          }
        }
      }, 500);
    };
    init();
  }, []);

  const logOut = function () {
    removeCookie('name');
    removeCookie('address');
    removeCookie('publicKey');
    Router.push('/sign-in');
  };

  return (
    <div>
      <div>
        <button onClick={logOut}>Log Out</button>
      </div>
      <div>
        <label>name: </label>
        {userData.name}
      </div>
      <div>
        <label>address: </label>
        {userData.address}
      </div>
      <div>
        <label>publicKey: </label>
        {userData.publicKey}
      </div>
      <QuestList></QuestList>
      <div></div>
    </div>
  );
};

export default Home;
