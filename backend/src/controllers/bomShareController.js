const bomShareService = require('../services/bomShareService');

class BomShareController {
  /**
   * POST /api/bom/share
   * Create share links for a BOM
   */
  async createShares(req, res) {
    try {
      const { bomId, projectId, sharedWithUserIds, message } = req.body;
      const sharedByUserId = req.user.id; // From auth middleware

      // Validation - accept either bomId or projectId
      if ((!bomId && !projectId) || !sharedWithUserIds || !Array.isArray(sharedWithUserIds)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request: (bomId or projectId) and sharedWithUserIds array required'
        });
      }

      if (sharedWithUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one user must be selected'
        });
      }

      const share = await bomShareService.createShares(
        bomId || projectId,
        sharedByUserId,
        sharedWithUserIds,
        message,
        !bomId // isProjectId flag
      );

      res.json({
        success: true,
        share // Single share object with one link for all users
      });
    } catch (error) {
      console.error('Error creating shares:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create shares'
      });
    }
  }

  /**
   * GET /api/bom/shared/:token
   * Access a shared BOM via token
   */
  async accessSharedBom(req, res) {
    try {
      const { token } = req.params;
      const currentUserId = req.user.id;

      const result = await bomShareService.accessSharedBom(token, currentUserId);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error accessing shared BOM:', error);
      const statusCode = error.message.includes('Access denied') ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to access shared BOM'
      });
    }
  }

  /**
   * GET /api/bom/share-history/:bomId
   * Get share history for a BOM
   */
  async getShareHistory(req, res) {
    try {
      const { bomId } = req.params;
      const shares = await bomShareService.getShareHistory(bomId);

      res.json({
        success: true,
        shares
      });
    } catch (error) {
      console.error('Error fetching share history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch share history'
      });
    }
  }

  /**
   * GET /api/bom/shared-with-me
   * Get all BOMs shared with the current user
   */
  async getSharedWithMe(req, res) {
    try {
      const userId = req.user.id;
      const shares = await bomShareService.getSharedWithUser(userId);

      res.json({
        success: true,
        shares
      });
    } catch (error) {
      console.error('Error fetching shared BOMs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch shared BOMs'
      });
    }
  }

  /**
   * GET /api/bom/new-shares-count
   * Get count of new (unaccessed) shares for current user
   */
  async getNewSharesCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await bomShareService.getNewSharesCount(userId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error fetching new shares count:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch new shares count'
      });
    }
  }

  /**
   * GET /api/bom/share-preview/:token
   * Get public preview of shared BOM (NO authentication required)
   */
  async getSharePreview(req, res) {
    try {
      const { token } = req.params;
      const preview = await bomShareService.getSharePreview(token);

      res.json({
        success: true,
        preview
      });
    } catch (error) {
      console.error('Error fetching share preview:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch share preview'
      });
    }
  }
}

module.exports = new BomShareController();
