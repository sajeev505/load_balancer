import express from 'express';
const app = express();

app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.get('*', (req, res) => res.send('Response from Server 1'));

app.listen(3001, () => console.log('Server 1 on port 3001'));
