const prisma = require('../prismaClient');

class CustomBomService {
  // GET /api/custom-bom/:projectId
  async getByProjectId(projectId) {
    const id = parseInt(projectId);

    const rows = await prisma.$queryRaw`
      SELECT id, project_id, ss304_rate, al6063_rate, t6_rate, gi_rate, buildings, created_at, updated_at
      FROM custom_boms
      WHERE project_id = ${id}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return {
        projectId: id,
        ss304Rate: 0,
        al6063Rate: 0,
        t6Rate: 0,
        giRate: 0,
        buildings: [],
      };
    }

    const row = rows[0];
    let buildings = [];
    try {
      buildings = typeof row.buildings === 'string' ? JSON.parse(row.buildings) : (row.buildings || []);
    } catch {
      buildings = [];
    }

    return {
      id: row.id,
      projectId: row.project_id,
      ss304Rate: Number(row.ss304_rate || 0),
      al6063Rate: Number(row.al6063_rate || 0),
      t6Rate: Number(row.t6_rate || 0),
      giRate: Number(row.gi_rate || 0),
      buildings,
    };
  }

  // PUT /api/custom-bom/:projectId  (upsert)
  async upsert(projectId, data) {
    const id = parseInt(projectId);
    const {
      ss304Rate = 0,
      al6063Rate = 0,
      t6Rate = 0,
      giRate = 0,
      buildings = [],
    } = data;

    const buildingsJson = JSON.stringify(buildings);

    // Check if record exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM custom_boms WHERE project_id = ${id} LIMIT 1
    `;

    if (existing && existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE custom_boms
        SET ss304_rate = ${ss304Rate},
            al6063_rate = ${al6063Rate},
            t6_rate = ${t6Rate},
            gi_rate = ${giRate},
            buildings = ${buildingsJson},
            updated_at = NOW()
        WHERE project_id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO custom_boms (project_id, ss304_rate, al6063_rate, t6_rate, gi_rate, buildings, created_at, updated_at)
        VALUES (${id}, ${ss304Rate}, ${al6063Rate}, ${t6Rate}, ${giRate}, ${buildingsJson}, NOW(), NOW())
      `;
    }

    return {
      projectId: id,
      ss304Rate: Number(ss304Rate),
      al6063Rate: Number(al6063Rate),
      t6Rate: Number(t6Rate),
      giRate: Number(giRate),
      buildings,
    };
  }
}

module.exports = new CustomBomService();
