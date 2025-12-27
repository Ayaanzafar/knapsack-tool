const prisma = require('../src/prismaClient');

async function seedDefaultNotes() {
  try {
    console.log('🌱 Seeding default notes...');

    const defaultNotes = [
      {
        noteOrder: 1,
        noteText: 'Cut Length of Long Rails subject to change during detailing based on availability.'
      },
      {
        noteOrder: 2,
        noteText: 'For all Roofs purlins are assumed to be at 1300mm where details of existing purlins are not shown in layout shared by client.'
      },
      {
        noteOrder: 3,
        noteText: 'Length of Long Rails subject to change based on actual purlin locations at site to fix the Long rail only on purlin. If any extra length of rails are required, they shall be charged extra.'
      },
      {
        noteOrder: 4,
        noteText: 'For Roofs with purlin span more than 1.7m, 2 Long Rails + 1 Mini Rail per each side of panel are considered.'
      },
      {
        noteOrder: 5,
        noteText: 'Purlin Details of sheds T10, T11, T14, T15 are not mentioned in report. They are assumed to be 1.5m. If the actual span is more than 1.7m, an extra Mini rail must be considered additionally (at extra cost).'
      }
    ];

    for (const note of defaultNotes) {
      const existing = await prisma.defaultNote.findUnique({
        where: { noteOrder: note.noteOrder }
      });

      if (existing) {
        console.log(`✓ Default note ${note.noteOrder} already exists`);
      } else {
        await prisma.defaultNote.create({
          data: note
        });
        console.log(`✓ Created default note ${note.noteOrder}`);
      }
    }

    console.log('✅ Default notes seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding default notes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDefaultNotes();
