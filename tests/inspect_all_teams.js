const dotenv = require('dotenv');
dotenv.config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}
const mongoose = require('mongoose');
const Team = require('../models/Team');

async function inspectTeams() {
  await mongoose.connect(process.env.MONGODB_URI);
  const teams = await Team.find({}).sort({ submittedAt: -1 });
  
  console.log('====================================================');
  console.log(`📋 TOTAL TEAMS IN DATABASE: ${teams.length}`);
  console.log('====================================================');
  
  teams.forEach((t, i) => {
    console.log(`\nTeam #${i + 1}: ${t.teamName} (Status: ${t.status})`);
    console.log(`  Leader: ${t.leader ? t.leader.name : 'N/A'} (${t.leader ? t.leader.registerNumber : 'N/A'})`);
    console.log(`  Submitted At: ${t.submittedAt}`);
    console.log(`  PPT File Path: ${t.pptFile}`);
    console.log(`  Eureka Screenshot: ${t.eurekaScreenshot}`);
  });
  console.log('====================================================');
  await mongoose.disconnect();
}

inspectTeams();
