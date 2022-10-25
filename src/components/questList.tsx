import { useState, useEffect } from 'react';
import { QuestData } from '../shared/types';
import datas from 'public/tempData/data.json';
import { AddQuest } from './addQuest';
import { getActivePublicKey } from 'sss-module';
import { apiClient } from 'src/shared/lib/apiClient';
import {
  acceptRequestContract,
  approveRequestContract,
} from '../shared/lib/contracts';
export const QuestList = () => {
  const [questDatas, setQuestDatas] = useState<QuestData[]>([]);
  const [userRequestDatas, setUserRequestDatas] = useState<QuestData[]>([]);
  const [userWorksDatas, setuserWorksDatas] = useState<QuestData[]>([]);

  useEffect(() => {
    const init = async () => {
      const quests: QuestData[] = datas.datas;
      console.log(quests);
      if (quests == undefined) return;
      const list = quests.filter((q) => {
        return q.status == 0;
      });
      setQuestDatas(list);
      setTimeout(() => {
        setUserRequestDatas(filterRequests(quests));
      }, 500);
      setTimeout(() => {
        setuserWorksDatas(filterWorks(quests));
      }, 500);
    };
    init();
  }, []);

  const filterRequests = function (list: QuestData[]) {
    return list
      .filter((q) => {
        return q.requesterPubKey == getActivePublicKey();
      })
      .filter((q) => {
        return q.status != 2;
      });
  };

  const filterWorks = function (list: QuestData[]) {
    return list
      .filter((q) => {
        return q.workerPubKey == getActivePublicKey();
      })
      .filter((q) => {
        return q.status != 2;
      });
  };

  const acceptRequest = async (id: string) => {
    const hash = await acceptRequestContract(id);
    const d = datas.datas;
    const request = d.find((q) => {
      return q.id == id;
    });
    if (request == undefined) return;
    request.workerPubKey = getActivePublicKey();
    request.status = 1;
    datas.datas = d;
    apiClient.post('/api/overrideQuest', datas);
    console.log('accept');
    console.log(hash);
  };

  const approveRequest = async (questData: QuestData) => {
    const hash = await approveRequestContract(questData);
    const d = datas.datas;
    const request = d.find((q) => {
      return q.id == questData.id;
    });
    if (request == undefined) return;
    request.status = 2;
    datas.datas = d;
    apiClient.post('/api/overrideQuest', datas);
    console.log('approve');
    console.log(hash);
  };

  const deleteRequest = async (questData: QuestData) => {
    const d = datas.datas;
    const result = d.filter((q) => {
      return q.id != questData.id;
    });
    datas.datas = result;
    apiClient.post('/api/overrideQuest', datas);
    console.log('delete');
  };

  return (
    <div>
      <h2>Quests</h2>
      <AddQuest></AddQuest>
      <div>
        <h3>List</h3>
        {questDatas.map((val) => (
          <div
            style={{
              width: '450px',
              border: '1px solid #000',
              padding: '10px',
              float: 'left',
            }}
          >
            <div>
              <label style={{ marginRight: '10px' }}>id</label>
              <span style={{ fontSize: '1px' }}>{val.id}</span>
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>title</label>
              {val.title}
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>details</label>
              {val.details}
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>reward</label>
              {val.reward}
            </div>
            {val.status == 0 ? (
              <button onClick={() => acceptRequest(val.id)}>work</button>
            ) : (
              ''
            )}
          </div>
        ))}
      </div>
      <br style={{ clear: 'both' }} />
      <div style={{ marginTop: '10px' }}>
        <h3>Your Requests</h3>
        {userRequestDatas.map((val) => (
          <div
            style={{
              width: '450px',
              border: '1px solid #000',
              padding: '10px',
              float: 'left',
            }}
          >
            <div>
              <label style={{ marginRight: '10px' }}>id</label>
              <span style={{ fontSize: '1px' }}>{val.id}</span>
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>title</label>
              {val.title}
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>details</label>
              {val.details}
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>reward</label>
              {val.reward}
            </div>
            {val.workerPubKey != '' ? (
              <button onClick={() => approveRequest(val)}>approve</button>
            ) : (
              <button onClick={() => deleteRequest(val)}>delete</button>
            )}
          </div>
        ))}
      </div>
      <br style={{ clear: 'both' }} />
      <div style={{ marginTop: '10px' }}>
        <h3>Your Works</h3>
        {userWorksDatas.map((val) => (
          <div
            style={{
              width: '450px',
              border: '1px solid #000',
              padding: '10px',
              float: 'left',
            }}
          >
            <div>
              <label style={{ marginRight: '10px' }}>id</label>
              <span style={{ fontSize: '1px' }}>{val.id}</span>
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>title</label>
              {val.title}
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>details</label>
              {val.details}
            </div>
            <div>
              <label style={{ marginRight: '10px' }}>reward</label>
              {val.reward}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
