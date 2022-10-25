import { useState, ChangeEvent } from 'react';
import { QuestData } from '../shared/types';
import { createQuestContract } from '../shared/lib/contracts';
import { apiClient } from 'src/shared/lib/apiClient';
import { getActivePublicKey } from 'sss-module';

export const AddQuest = () => {
  const [questData, setQuestData] = useState<QuestData>({
    id: '',
    requesterPubKey: '',
    workerPubKey: '',
    title: '',
    details: '',
    reward: 0,
    status: 0,
  });
  const handleQuestChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuestData({ ...questData, [name]: value });
  };
  const createQuest = async () => {
    const hash = await createQuestContract();
    console.log(hash);
    const quest: QuestData = {
      id: hash,
      requesterPubKey: getActivePublicKey(),
      workerPubKey: '',
      title: questData.title,
      details: questData.details,
      reward: Number(questData.reward),
      status: 0,
    };
    apiClient.post('/api/createQuest', quest);
    console.log(quest);
  };
  return (
    <div>
      <h3>Request</h3>
      <label>title</label>
      <input
        type="text"
        name="title"
        style={{ marginLeft: '10px', width: '350px' }}
        onChange={handleQuestChange}
        value={questData.title}
      ></input>
      <br />
      <label>details</label>
      <input
        type="text"
        name="details"
        style={{ marginLeft: '10px', width: '350px' }}
        onChange={handleQuestChange}
        value={questData.details}
      ></input>
      <br />
      <label>reward</label>
      <input
        type="number"
        name="reward"
        style={{ marginLeft: '10px', width: '100px' }}
        onChange={handleQuestChange}
        value={questData.reward}
      ></input>
      <br />
      <br />
      <input type="button" value="request" onClick={createQuest}></input>
    </div>
  );
};
