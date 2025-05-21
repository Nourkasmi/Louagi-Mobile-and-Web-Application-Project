const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function testLogin(email, plainPassword) {
  try {
    console.log('Testing password:', JSON.stringify(plainPassword));
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User found:', user.toJSON());

    const match = await bcrypt.compare(plainPassword, user.password);
    console.log('Password match:', match);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin('ahmed@gmail.com', 'Ahmed123');
