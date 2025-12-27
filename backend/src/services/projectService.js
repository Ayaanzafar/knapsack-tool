const prisma = require('../prismaClient');

class ProjectService {
  // Create a new project
  async createProject(data) {
    return await prisma.project.create({
      data: {
        name: data.name || 'Untitled Project',
        clientName: data.clientName || null,
        projectId: data.projectId || null,
        longRailVariation: data.longRailVariation || null,
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

  // Get projects by User ID
  async getProjectsByUser(userId) {
    return await prisma.project.findMany({
      where: { 
        isActive: true,
        userId: parseInt(userId)
      },
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
    if (data.longRailVariation !== undefined) updateData.longRailVariation = data.longRailVariation;

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

  // Get all projects with pagination
  async getAllProjectsPaginated(options) {
    const { page, limit, sortBy, search } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
        { projectId: { contains: search } }
      ];
    }

    // Build orderBy clause
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'latestUpdated':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get paginated projects
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit
    });

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get projects by User ID with pagination
  async getProjectsByUserPaginated(userId, options) {
    const { page, limit, sortBy, search } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      isActive: true,
      userId: parseInt(userId)
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
        { projectId: { contains: search } }
      ];
    }

    // Build orderBy clause
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'latestUpdated':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get paginated projects
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit
    });

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new ProjectService();
