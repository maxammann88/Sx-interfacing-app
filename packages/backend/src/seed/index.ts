import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // --- Feedback Items (Tickets) ---
  const ticketsPath = path.join(__dirname, 'tickets.json');
  if (fs.existsSync(ticketsPath)) {
    const existing = await prisma.feedbackItem.count();
    if (existing > 0) {
      console.log(`  ⏭  feedback_items: ${existing} already exist – skipping`);
    } else {
      const tickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf-8'));
      for (const ticket of tickets) {
        await prisma.feedbackItem.create({
          data: {
            ...ticket,
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt),
            deadlineDate: ticket.deadlineDate ? new Date(ticket.deadlineDate) : null,
          },
        });
      }
      console.log(`  ✅ feedback_items: ${tickets.length} tickets inserted`);
    }
  }

  // --- Team Members ---
  const teamMembers = [
    { name: 'Max Ammann', role: 'Lead', stream: 'Franchise Controlling' },
    { name: 'Henning Seidel', role: 'Developer', stream: 'Franchise Controlling' },
    { name: 'Herbert Krenn', role: 'Developer', stream: 'Franchise Controlling' },
    { name: 'Inês Boavida Couto', role: 'Developer', stream: 'Franchise Controlling' },
  ];

  const existingMembers = await prisma.teamMember.count();
  if (existingMembers > 0) {
    console.log(`  ⏭  team_members: ${existingMembers} already exist – skipping`);
  } else {
    for (const member of teamMembers) {
      await prisma.teamMember.upsert({
        where: { name: member.name },
        update: {},
        create: member,
      });
    }
    console.log(`  ✅ team_members: ${teamMembers.length} members inserted`);
  }

  // --- Streams & Sub-Apps ---
  const streams = [
    {
      name: 'Franchise Controlling',
      sortOrder: 1,
      streamOwner: 'Max Ammann',
      subApps: [
        { app: 'Interfacing', owner: 'Henning Seidel', status: 'Live', isStarted: true },
        { app: 'Reporting & Controlling', owner: 'Inês Boavida Couto', status: 'Planning' },
        { app: 'Parameter Maintenance', owner: 'Herbert Krenn', status: 'Planning' },
        { app: 'Partner Requests', owner: 'Inês Boavida Couto', status: 'Planning' },
      ],
    },
    {
      name: 'FSM',
      sortOrder: 2,
      streamOwner: 'Max Ammann',
      subApps: [
        { app: 'FSM-Calculation', owner: 'Max Ammann', status: 'Planning' },
      ],
    },
    {
      name: 'Core',
      sortOrder: 3,
      streamOwner: 'Max Ammann',
      subApps: [
        { app: 'Core', owner: 'Max Ammann', status: 'Live', isStarted: true },
      ],
    },
    {
      name: 'B2P Controlling',
      sortOrder: 4,
      streamOwner: '',
      subApps: [
        { app: 'Partner Requests & Reconciliation', owner: '', status: 'Planning' },
        { app: 'Parameter Maintenance', owner: '', status: 'Planning' },
        { app: 'VPF', owner: '', status: 'Planning' },
        { app: 'Bonus & Accruals', owner: '', status: 'Planning' },
        { app: 'Month End Processes', owner: '', status: 'Planning' },
        { app: 'Reporting & Controlling', owner: '', status: 'Planning' },
      ],
    },
  ];

  const existingStreams = await prisma.stream.count();
  if (existingStreams > 0) {
    console.log(`  ⏭  streams: ${existingStreams} already exist – skipping`);
  } else {
    for (const s of streams) {
      const { subApps, ...streamData } = s;
      const stream = await prisma.stream.create({ data: streamData });
      for (const sa of subApps) {
        await prisma.subApp.create({
          data: { ...sa, streamId: stream.id },
        });
      }
    }
    console.log(`  ✅ streams: ${streams.length} streams with sub-apps inserted`);
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
