
```
knapsack-tool
├─ .claude
│  └─ settings.local.json
├─ ADD_ROW_COST_CALCULATION_PLAN.md
├─ backend
│  ├─ .env
│  ├─ All Profiles - 05-12-2025 - Product Codes.xlsx
│  ├─ bom_data_export.json
│  ├─ BOM_DATA_SEEDING.md
│  ├─ BOM_IMAGE_SETUP_GUIDE.md
│  ├─ BOM_STANDARD_LENGTH_UPDATE.md
│  ├─ BOM_TEMPLATES_IMPLEMENTATION_SUMMARY.md
│  ├─ checkBomModuleWp.js
│  ├─ DEPLOYMENT_GUIDE.md
│  ├─ IMAGE_FILENAME_MAPPING.csv
│  ├─ IMAGE_FILENAME_MAPPING.json
│  ├─ IMAGE_FILENAME_MAPPING.txt
│  ├─ knapsack-backend.service
│  ├─ Long Rail MMS Variants_2.xlsx
│  ├─ Long Rail MMS Variants_8_types.xlsx
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ migrations
│  │  │  ├─ 20251209171317_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251212062925_add_costing_fields
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251212091610_add_long_rail_profile_to_tabs
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251215183938_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251219082049_add_client_name_and_project_id
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251222074132_add_user_model_and_auth
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251224060606_add_long_rail_variation_to_projects
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251224125854_add_saved_boms_table
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251227170714_add_default_notes
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20251228065716_add_user_status_and_soft_delete
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260106_add_fasteners_and_polymorphic_links
│  │  │  │  └─ migration.sql
│  │  │  ├─ add_default_notes.sql
│  │  │  └─ migration_lock.toml
│  │  ├─ production_data.json
│  │  ├─ schema.prisma
│  │  ├─ seed.js
│  │  ├─ seed_auth.js
│  │  └─ seed_production.js
│  ├─ prisma.config.ts
│  ├─ scripts
│  │  ├─ addFastenerFormulas.js
│  │  ├─ addFasteners.js
│  │  ├─ addNewImagePath.js
│  │  ├─ analyzeVariations.js
│  │  ├─ checkApiData.js
│  │  ├─ checkBomItems.js
│  │  ├─ checkBomMasterVendors.js
│  │  ├─ checkFormulaMappings.js
│  │  ├─ checkFormulas.js
│  │  ├─ checkHardwareItems.js
│  │  ├─ checkImagePaths.js
│  │  ├─ checkItem.js
│  │  ├─ checkRmCodes.js
│  │  ├─ checkStandardLengths.js
│  │  ├─ checkVariationLinks.js
│  │  ├─ check_c45_formulas.js
│  │  ├─ check_missing_formulas.js
│  │  ├─ clearWrongImagePaths.js
│  │  ├─ compareDatabaseVsTemplate.js
│  │  ├─ export_for_production.js
│  │  ├─ extractVariationTemplates.js
│  │  ├─ findByRmCode.js
│  │  ├─ findCorrectImageMappings.js
│  │  ├─ findRmCode.js
│  │  ├─ fixAllVendorNames.js
│  │  ├─ fixVendorNames.js
│  │  ├─ fix_user_status.sql
│  │  ├─ generateImageMapping.js
│  │  ├─ getVariationProfiles.js
│  │  ├─ import-output.txt
│  │  ├─ importBomData.js
│  │  ├─ importSunrackProfiles.js
│  │  ├─ linkBomToProfiles.js
│  │  ├─ listAllSunrackCodes.js
│  │  ├─ migrateBOMsToOptimized.js
│  │  ├─ migrations
│  │  │  ├─ 01_migrate_fasteners.js
│  │  │  ├─ 02_migrate_formulas.js
│  │  │  ├─ 03_migrate_variation_items.js
│  │  │  ├─ 04_migrate_sunrack_profiles.js
│  │  │  ├─ 05_repopulate_fasteners_from_excel.js
│  │  │  ├─ 06_relink_formulas.js
│  │  │  ├─ 07_relink_variation_items.js
│  │  │  ├─ 08_recreate_fastener_formulas.js
│  │  │  ├─ 09_recreate_fastener_variation_items_from_excel.js
│  │  │  ├─ 10_correct_sds_formula.js
│  │  │  ├─ 11_remove_sds_standard_length.js
│  │  │  ├─ 12_set_default_fastener_costs.js
│  │  │  ├─ 13_analyze_c45_variations.js
│  │  │  ├─ 14_add_c45_variations.js
│  │  │  ├─ 15_set_sort_order.js
│  │  │  └─ run_all_migrations.js
│  │  ├─ seedBomComplete.js
│  │  ├─ seedBomData.js
│  │  ├─ seedBomFormulas.js
│  │  ├─ seedDefaultNotes.js
│  │  ├─ seedVariationTemplates.js
│  │  ├─ setDefaultProfile.js
│  │  ├─ syncStandardLengths.js
│  │  ├─ testTemplateAPI.js
│  │  ├─ updateCorrectImagePaths.js
│  │  ├─ updateFormulaMatchingImages.js
│  │  ├─ updateImagePaths.js
│  │  ├─ updateProfileImages.js
│  │  ├─ updateStandardLengths.js
│  │  ├─ verifyData.js
│  │  ├─ verifyImageSetup.js
│  │  ├─ verifyTemplateItems.js
│  │  └─ viewTemplateData.js
│  ├─ SEEDING_INSTRUCTIONS.md
│  ├─ src
│  │  ├─ constants
│  │  │  └─ bomDefaults.js
│  │  ├─ controllers
│  │  │  ├─ authController.js
│  │  │  ├─ bomController.js
│  │  │  ├─ defaultNotesController.js
│  │  │  ├─ pdfController.js
│  │  │  ├─ projectController.js
│  │  │  ├─ rowController.js
│  │  │  ├─ savedBomController.js
│  │  │  ├─ tabController.js
│  │  │  └─ userController.js
│  │  ├─ middleware
│  │  │  ├─ authMiddleware.js
│  │  │  ├─ bomPermissions.js
│  │  │  ├─ errorHandler.js
│  │  │  └─ tabPermissions.js
│  │  ├─ prismaClient.js
│  │  ├─ routes
│  │  │  ├─ authRoutes.js
│  │  │  ├─ bomRoutes.js
│  │  │  ├─ defaultNotesRoutes.js
│  │  │  ├─ projectRoutes.js
│  │  │  ├─ rowRoutes.js
│  │  │  ├─ savedBomRoutes.js
│  │  │  ├─ tabRoutes.js
│  │  │  ├─ templateRoutes.js
│  │  │  └─ userRoutes.js
│  │  ├─ server.js
│  │  └─ services
│  │     ├─ bomReconstructionService.js
│  │     ├─ bomService.js
│  │     ├─ defaultNotesService.js
│  │     ├─ projectService.js
│  │     ├─ rowService.js
│  │     ├─ savedBomService.js
│  │     └─ tabService.js
│  ├─ static
│  │  └─ profile-images
│  │     ├─ C45-RAIL.png
│  │     ├─ MA-100.png
│  │     ├─ MA-102.png
│  │     ├─ MA-109.png
│  │     ├─ MA-110.png
│  │     ├─ MA-35.png
│  │     ├─ MA-43.png
│  │     ├─ MA-44.png
│  │     ├─ MA-46.png
│  │     ├─ MA-52.png
│  │     ├─ MA-57.png
│  │     ├─ MA-72.png
│  │     ├─ RL-49704.png
│  │     ├─ RL-49708.png
│  │     ├─ RL-49709.png
│  │     ├─ SN-5306.png
│  │     └─ SR-03.png
│  ├─ testConstants.js
│  ├─ uploads
│  ├─ VARIATION_PROFILES_NEEDED.csv
│  ├─ VARIATION_PROFILES_NEEDED.json
│  ├─ VARIATION_PROFILES_NEEDED.txt
│  └─ variation_templates_extracted.json
├─ BOM_EDIT_AND_CHANGELOG_PLAN.md
├─ BOM_IMPLEMENTATION_PLAN.md
├─ BOM_PROFILE_SELECTION_IMPLEMENTATION.md
├─ BOM_REFACTORING_PLAN.md
├─ BOM_VARIATION_IMPLEMENTATION_STATUS.md
├─ BOM_VARIATION_TEMPLATE_PLAN.md
├─ CODE_UPDATE_SUMMARY.md
├─ COMPLETE_REFACTORING_PLAN.md
├─ DATABASE_MIGRATION_PLAN.md
├─ DATABASE_REFACTORING_ANALYSIS.md
├─ DEBUG_SB1_ISSUE.md
├─ EXCEL_DATA_MIGRATION_COMPLETE.md
├─ GEMINI.md
├─ images
│  ├─ 2026-01-06 13_26_51-Long Rail MMS Variants_8_types.xlsx - Excel.jpg
│  └─ 2026-01-06 13_40_12-Sourcetree.jpg
├─ IMPLEMENTATION_PLAN.md
├─ INTEGRATION_IMPLEMENTATION_COMPLETE.md
├─ knapsack-front
│  ├─ .env.local
│  ├─ .env.production
│  ├─ BENCHMARK-README.md
│  ├─ benchmark-test.html
│  ├─ BENCHMARK-USAGE.md
│  ├─ dist
│  │  ├─ assets
│  │  │  ├─ bom-profiles
│  │  │  │  ├─ blind-rivets.png
│  │  │  │  ├─ M8_20_bolt.png
│  │  │  │  ├─ M8_60_bolt.png
│  │  │  │  ├─ M8_hex_nuts.png
│  │  │  │  ├─ M8_plain_washer.png
│  │  │  │  ├─ M8_spring_washer.png
│  │  │  │  ├─ MA-109.png
│  │  │  │  ├─ MA-110.png
│  │  │  │  ├─ MA-35.png
│  │  │  │  ├─ MA-43.png
│  │  │  │  ├─ MA-46.png
│  │  │  │  ├─ MA-72.png
│  │  │  │  ├─ mini_rail.png
│  │  │  │  ├─ rubber_pad.png
│  │  │  │  ├─ sds_4_2_13.png
│  │  │  │  └─ sds_5_5_63.png
│  │  │  ├─ index-D1x9onk7.css
│  │  │  └─ index-t7lYy-Wm.js
│  │  ├─ benchmark-test.html
│  │  ├─ black_back_photo.svg
│  │  ├─ fav.png
│  │  ├─ index.html
│  │  ├─ Logo For Yellow Background.svg
│  │  ├─ optimizer-benchmark.js
│  │  ├─ vite.svg
│  │  ├─ watermark0.png
│  │  └─ white_back_photo.svg
│  ├─ eslint.config.js
│  ├─ IMPROVEMENTS.md
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ assets
│  │  │  └─ bom-profiles
│  │  │     ├─ blind-rivets.png
│  │  │     ├─ M8_20_bolt.png
│  │  │     ├─ M8_60_bolt.png
│  │  │     ├─ M8_hex_nuts.png
│  │  │     ├─ M8_plain_washer.png
│  │  │     ├─ M8_spring_washer.png
│  │  │     ├─ MA-109.png
│  │  │     ├─ MA-110.png
│  │  │     ├─ MA-35.png
│  │  │     ├─ MA-43.png
│  │  │     ├─ MA-46.png
│  │  │     ├─ MA-72.png
│  │  │     ├─ mini_rail.png
│  │  │     ├─ rubber_pad.png
│  │  │     ├─ sds_4_2_13.png
│  │  │     └─ sds_5_5_63.png
│  │  ├─ benchmark-test.html
│  │  ├─ black_back_photo.svg
│  │  ├─ fav.png
│  │  ├─ Logo For Yellow Background.svg
│  │  ├─ optimizer-benchmark.js
│  │  ├─ vite.svg
│  │  ├─ watermark0.png
│  │  └─ white_back_photo.svg
│  ├─ README.md
│  ├─ RESULT-OUTPUT-GUIDE.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ App.jsx.backup
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ Auth
│  │  │  │  ├─ ChangePasswordPage.jsx
│  │  │  │  └─ LoginPage.jsx
│  │  │  ├─ BOM
│  │  │  │  ├─ AddRowModal.jsx
│  │  │  │  ├─ BOMPage.jsx
│  │  │  │  ├─ BOMPrintPreview.jsx
│  │  │  │  ├─ BOMTable.jsx
│  │  │  │  ├─ BOMTableRow.jsx
│  │  │  │  ├─ ChangeLogDisplay.jsx
│  │  │  │  ├─ CreateBOMButton.jsx
│  │  │  │  ├─ DeleteRowModal.jsx
│  │  │  │  ├─ NotesSection.jsx
│  │  │  │  ├─ PrintSettingsModal.jsx
│  │  │  │  ├─ ReasonModal.jsx
│  │  │  │  └─ ReviewChangesModal.jsx
│  │  │  ├─ CloseTabConfirmDialog.jsx
│  │  │  ├─ ComboBox.jsx
│  │  │  ├─ CreateTabDialog.jsx
│  │  │  ├─ GlobalInputs.jsx
│  │  │  ├─ Header.jsx
│  │  │  ├─ LongRailDropdown.jsx
│  │  │  ├─ RailTable.jsx
│  │  │  ├─ RenameTabDialog.jsx
│  │  │  ├─ ResultCard.jsx
│  │  │  ├─ SettingsPanel.jsx
│  │  │  ├─ TabBar.jsx
│  │  │  ├─ TabContextMenu.jsx
│  │  │  ├─ Tooltip.jsx
│  │  │  └─ ui.jsx
│  │  ├─ constants
│  │  │  ├─ bomDefaults.js
│  │  │  └─ longRailVariation.js
│  │  ├─ context
│  │  │  └─ AuthContext.jsx
│  │  ├─ hooks
│  │  │  └─ usePersistedRows.js
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  ├─ calculations.js
│  │  │  ├─ changeTracker.js
│  │  │  ├─ optimizer-benchmark.js
│  │  │  ├─ optimizer.js
│  │  │  ├─ run-benchmark.js
│  │  │  ├─ storage.js
│  │  │  ├─ tabStorage.js
│  │  │  └─ tabStorageAPI.js
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ AdminBOMView.jsx
│  │  │  ├─ AdminPanel.jsx
│  │  │  ├─ BOMManagementTab.jsx
│  │  │  ├─ CreateProjectPage.jsx
│  │  │  ├─ ElectricBorder.jsx
│  │  │  ├─ HomePage.jsx
│  │  │  ├─ NotFoundPage.jsx
│  │  │  ├─ shuffle.jsx
│  │  │  └─ SplitText.jsx
│  │  ├─ Router.jsx
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  ├─ bomCalculations.js
│  │  │  ├─ bomCalculations_OLD_BACKUP.js
│  │  │  ├─ bomDataCollection.js
│  │  │  ├─ config.js
│  │  │  └─ templateService.js
│  │  └─ styles
│  │     └─ print.css
│  ├─ status.md
│  └─ vite.config.js
├─ OPTIMIZED_BOM_STORAGE.md
├─ REFACTORING_COMPLETE.md
├─ REFACTORING_PROGRESS_REPORT.md
├─ reference_bom_image.jpg
├─ reference_cost_issue.jpg
├─ RELATIONAL_MIGRATION_COMPLETE.md
├─ SB1_SB2_FIX_GUIDE.md
├─ SETUP_AND_TESTING_GUIDE.md
└─ VARIATION_TEMPLATE_INTEGRATION_ANALYSIS.md

```