const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use(express.static('views'));

// Connect to MongoDB Atlas or local MongoDB
mongoose.connect('mongodb://localhost:27017/affiliateSite', { useNewUrlParser: true, useUnifiedTopology: true });

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  cashback: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

// Transaction schema
const transactionSchema = new mongoose.Schema({
  userId: String,
  store: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashed });
  await user.save();
  res.json({ message: 'User registered successfully!' });
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, 'secretKey');
  res.json({ message: 'Login successful', token });
});

// Track cashback
app.post('/track', async (req, res) => {
  const { userId, store, amount } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ error: 'User not found' });

  user.cashback += amount;
  await user.save();

  const transaction = new Transaction({ userId, store, amount });
  await transaction.save();

  res.json({ message: 'Cashback updated', cashback: user.cashback });
});

// Deals API
app.get('/api/deals', (req, res) => {
  res.json([
    { id: 1, title: "Amazon Special Deal", link: "https://amzn.to/4uNMeTT", cashback: "10%" },
    { id: 2, title: "Flipkart Offer", link: "https://flipkart.com/?affid=yourAffiliateID", cashback: "8%" },
    { id: 3, title: "Myntra Sale", link: "https://myntra.com/?affid=yourAffiliateID", cashback: "12%" }
  ]);
});

// User profile
app.get('/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    username: user.username,
    email: user.email,
    cashback: user.cashback
  });
});

// Cashback history
app.get('/history/:userId', async (req, res) => {
  const transactions = await Transaction.find({ userId: req.params.userId });
  res.json(transactions);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});