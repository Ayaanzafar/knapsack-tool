/**
 * Adapts Custom BOM data (per-building line items) to the structure expected by
 * {@link ../components/BOM/BOMPrintPreview.jsx} (Long Rail–style layout).
 */

function safeDescription(item) {
  const name = (item.genericName || '').trim();
  const desc = (item.itemDescription || '').trim();
  if (name && desc && desc !== name) return `${name} — ${desc}`;
  if (name) return name;
  if (desc) return desc;
  return '—';
}

/**
 * @param {object} params
 * @param {object} [params.project] - project from API (name, createdAt, etc.)
 * @param {object} params.building - { id, name, items: [] }
 * @param {number} [params.moduleWp]
 * @param {number} [params.sparePercent]
 * @returns {object} bomData for print preview
 */
export function customBuildingToPrintBomData({ project, building, moduleWp, sparePercent }) {
  if (!building?.items?.length) {
    throw new Error('Add at least one line item before printing.');
  }

  const tabName = (building.name && String(building.name).trim()) || 'Building';
  const tabs = [tabName];
  const panelCounts = { [tabName]: 0 };

  const bomItems = building.items.map((item, index) => {
    const qty = parseFloat(item.quantity) || 0;
    const spareQty = item.spareQty != null ? parseFloat(item.spareQty) : 0;
    const finalQty = item.finalQty != null ? parseFloat(item.finalQty) : qty + spareQty;
    const designWeight = parseFloat(item.designWeight) || 0;
    const length = parseFloat(item.length) || 0;
    const isFastener = item.itemType === 'FASTENER';
    const wtPerRm = !isFastener ? designWeight : 0;
    const rm = parseFloat(item.rm) || 0;
    const wt = parseFloat(item.wt) || 0;
    const cost = parseFloat(item.cost) || 0;
    const costPerPiece = parseFloat(item.costPerPiece) || 0;
    const rate = item.rateKgOverride != null
      ? parseFloat(item.rateKgOverride) || 0
      : parseFloat(item.rate) || 0;

    const desc = safeDescription(item);
    const userEdits = (!isFastener && (wt > 0 || wtPerRm > 0) && !costPerPiece && rate > 0)
      ? { manualAluminumRate: rate }
      : undefined;

    return {
      _id: item.id,
      sn: index + 1,
      sunrackCode: (item.itemCode && String(item.itemCode).trim()) || '—',
      profileImage: item.profileImagePath || null,
      itemDescription: desc,
      material: (item.material && String(item.material)) || '—',
      length: isFastener ? null : length,
      uom: (item.uom && String(item.uom)) || '—',
      quantities: { [tabName]: qty },
      totalQuantity: qty,
      spareQuantity: Math.max(0, spareQty),
      finalTotal: Math.max(0, finalQty),
      wtPerRm,
      rm,
      wt,
      cost,
      costPerPiece: costPerPiece > 0 ? costPerPiece : null,
      userEdits,
    };
  });

  return {
    isCustomBom: true,
    customBomMeta: {
      buildingName: building.name,
      sparePercent: sparePercent != null ? Number(sparePercent) : null,
      moduleWp: moduleWp != null ? Number(moduleWp) : null,
    },
    projectInfo: {
      projectName: project?.name || 'Custom BOM Project',
      longRailVariation: 'Custom BOM',
      isCustomBom: true,
      createdBy:
        project?.user?.username ||
        project?.createdBy?.username ||
        (typeof project?.createdBy === 'string' ? project.createdBy : null) ||
        null,
      createdAt: project?.createdAt || new Date().toISOString(),
      generatedAt: new Date().toISOString(),
    },
    tabs,
    panelCounts,
    bomItems,
  };
}
