require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Building = require('./models/Building');
const Floor = require('./models/Floor');
const Room = require('./models/Room');
const User = require('./models/User');

const buildingsData = [
  { name: 'AB-1', floors: 4 },
  { name: 'AB-2', floors: 9 },
  { name: 'AB-3', floors: 12 }
];

const teacherUsers = [
  { name: 'Abhishek Sharma', username: 'abhishek_sharma', password: '1234', role: 'teacher' },
  { name: 'Priya Verma', username: 'priya_verma', password: '5678', role: 'teacher' },
  { name: 'Rohan Mehta', username: 'rohan_mehta', password: '9012', role: 'teacher' },
  { name: 'Sneha Kapoor', username: 'sneha_kapoor', password: '3456', role: 'teacher' },
  { name: 'Arjun Singh', username: 'arjun_singh', password: '7890', role: 'teacher' },
  { name: 'Neha Joshi', username: 'neha_joshi', password: '2468', role: 'teacher' },
  { name: 'Karan Malhotra', username: 'karan_malhotra', password: '1357', role: 'teacher' },
  { name: 'Divya Patel', username: 'divya_patel', password: '4321', role: 'teacher' },
  { name: 'Rahul Deshmukh', username: 'rahul_deshmukh', password: '8765', role: 'teacher' },
  { name: 'Meera Nair', username: 'meera_nair', password: '1111', role: 'teacher' }
];

const adminUsers = [
  { name: 'Admin One', username: 'admin_one', password: 'admin123', role: 'admin' },
  { name: 'Admin Two', username: 'admin_two', password: 'admin456', role: 'admin' },
  { name: 'Admin Three', username: 'admin_three', password: 'admin789', role: 'admin' },
  { name: 'Admin Four', username: 'admin_four', password: 'admin321', role: 'admin' },
  { name: 'Admin Five', username: 'admin_five', password: 'admin654', role: 'admin' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await Building.deleteMany({});
  await Floor.deleteMany({});
  await Room.deleteMany({});
  await User.deleteMany({});

  const hashedTeachers = await Promise.all(
    teacherUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10)
    }))
  );

  const hashedAdmins = await Promise.all(
    adminUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10)
    }))
  );

  await User.collection.insertMany([...hashedTeachers, ...hashedAdmins]);
  console.log(`✅ Inserted ${hashedTeachers.length} teachers and ${hashedAdmins.length} admins`);

  for (const b of buildingsData) {
    const building = await Building.create({ name: b.name });
    let floorIds = [];

    console.log(`🏢 Creating building: ${b.name}`);

    for (let f = 1; f <= b.floors; f++) {
      const floor = await Floor.create({ number: f, building: building._id });
      let roomIds = [];

      console.log(`  🧱 Creating floor ${f} for ${b.name}`);

      for (let r = 1; r <= 10; r++) {
        const roomNum = `${f.toString().padStart(2, '0')}${r.toString().padStart(2, '0')}`;
        const room = await Room.create({ number: roomNum, floor: floor._id });
        roomIds.push(room._id);
        console.log(`    🚪 Created room ${roomNum} with ID ${room._id}`);
      }

      floor.rooms = roomIds;
      await floor.save();
      console.log(`  ✅ Linked ${roomIds.length} rooms to floor ${f}`);

      floorIds.push(floor._id);
    }

    building.floors = floorIds;
    await building.save();
    console.log(`✅ Linked ${floorIds.length} floors to building ${b.name}`);
  }

  console.log('🎉 Database seeded with users, buildings, floors, and rooms!');
  mongoose.disconnect();
}

seed();