import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import csvParser from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'database.csv');

app.use(cors());
app.use(bodyParser.json());

const headers = [
  { id: 'id', title: 'id' },
  { id: 'date', title: '날짜' },
  { id: 'type', title: '구분' },
  { id: 'category', title: '카테고리' },
  { id: 'paymentMethod', title: '결제수단' },
  { id: 'memo', title: '내용' },
  { id: 'amount', title: '금액' },
];

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, '\uFEFFid,날짜,구분,카테고리,결제수단,내용,금액\n');
}

// 1. 전체 내역 읽기
app.get('/api/transactions', (req, res) => {
  const results = [];
  if (!fs.existsSync(DB_FILE)) return res.json([]);
  fs.createReadStream(DB_FILE)
    .pipe(csvParser())
    .on('data', (data) => {
      const typeMap = { '수입': 'income', '지출': 'expense', '이체': 'transfer' };
      results.push({
        id: data['id'],
        date: data['날짜'],
        type: typeMap[data['구분']] || 'expense',
        category: data['카테고리'],
        paymentMethod: data['결제수단'],
        memo: data['내용'],
        amount: parseInt(data['금액'], 10) || 0
      });
    })
    .on('end', () => res.json(results));
});

// 2. 내역 추가
app.post('/api/transactions', async (req, res) => {
  const t = req.body;
  const typeMapInv = { income: '수입', expense: '지출', transfer: '이체' };
  const writer = createCsvWriter({ path: DB_FILE, header: headers, append: true });
  try {
    await writer.writeRecords([{ ...t, type: typeMapInv[t.type] }]);
    res.status(201).json({ message: 'Saved' });
  } catch (err) { res.status(500).send(err); }
});

// 3. 내역 수정
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  const results = [];
  const typeMapInv = { income: '수입', expense: '지출', transfer: '이체' };

  fs.createReadStream(DB_FILE)
    .pipe(csvParser())
    .on('data', (row) => {
      if (row.id === id) {
        results.push({
          id, date: updated.date, type: typeMapInv[updated.type], 
          category: updated.category, paymentMethod: updated.paymentMethod, 
          memo: updated.memo, amount: updated.amount
        });
      } else { results.push(row); }
    })
    .on('end', async () => {
      const writer = createCsvWriter({ path: DB_FILE, header: headers });
      await writer.writeRecords(results);
      res.json({ message: 'Updated' });
    });
});

// 4. 내역 삭제
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const results = [];
  fs.createReadStream(DB_FILE)
    .pipe(csvParser())
    .on('data', (row) => { if (row.id !== id) results.push(row); })
    .on('end', async () => {
      const writer = createCsvWriter({ path: DB_FILE, header: headers });
      await writer.writeRecords(results);
      res.json({ message: 'Deleted' });
    });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
