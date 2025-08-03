import bcrypt from 'bcrypt';

const password = process.argv[2] || 'admin@123';

// Hash the password
const hashPassword = async () => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  console.log('Hashed password:', hashed);
};

hashPassword();