const prisma = require('../prismaClient');

class ProjectService {
  // Create a new project
  async createProject(data) {
    return await prisma.project.create({
      data: {
        name: data.name || 'Untitled Project',
        clientName: data.clientName || null,
        projectId: data.projectId || null,
        userId: data.userId || null
      }
    });
  }

  // Get all projects
  async getAllProjects() {
    return await prisma.project.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get project by ID
  async getProjectById(id) {
    return await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });
  }

  // Get project with all tabs and rows
  async getProjectWithDetails(id) {
    return await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        tabs: {
          where: { isActive: true },
          include: {
            rows: {
              orderBy: { rowNumber: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  // Update project
  async updateProject(id, data) {
    const updateData = {
      updatedAt: new Date()
    };

    // Only include fields that are provided
    if (data.name !== undefined) updateData.name = data.name;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;

    return await prisma.project.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  }

  // Delete project (soft delete)
  async deleteProject(id) {
    return await prisma.project.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
  }

  // Hard delete project (also deletes all tabs and rows via CASCADE)
  async hardDeleteProject(id) {
    return await prisma.project.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = new ProjectService();
