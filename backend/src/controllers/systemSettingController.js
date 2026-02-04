import { SystemSetting } from '../models/index.js';
import { Op } from 'sequelize';

// Initial Defaults (to seed if missing?) - Could handle in seeders, but good as fallback
const DEFAULTS = [
    { key: 'theme_color', value: '#3B82F6', type: 'STRING', category: 'DISPLAY', description: 'Primary Theme Color' },
    { key: 'alert_threshold', value: '45', type: 'INTEGER', category: 'PROCESS', description: 'Wait time alert threshold (minutes)' },
    { key: 'enable_notifications', value: 'true', type: 'BOOLEAN', category: 'NOTIFICATIONS', description: 'Enable system notifications' }
];

export const getEffectiveSettings = async (req, res) => {
    try {
        const { siteId, companyId } = req.query;

        // 1. Fetch ALL settings relevant to this context
        // GLOBAL + (Optional) COMPANY + (Optional) SITE
        const whereClauses = [
            { scope: 'GLOBAL' }
        ];

        if (companyId) {
            whereClauses.push({ scope: 'COMPANY', scopeId: companyId });
        }
        if (siteId) {
            whereClauses.push({ scope: 'SITE', scopeId: siteId });
        }

        const settings = await SystemSetting.findAll({
            where: {
                [Op.or]: whereClauses
            }
        });

        // 2. Merge Logic: Global < Company < Site
        // We organize by Key.
        const mergedSettings = {};

        // Helper to process a list
        const processList = (list) => {
            list.forEach(setting => {
                mergedSettings[setting.key] = {
                    ...setting.toJSON(),
                    inheritedFrom: setting.scope // Track inheritance
                };
            });
        };

        // Filter and process in order of precedence (overwriting previous keys)

        // A. Global
        const globals = settings.filter(s => s.scope === 'GLOBAL');
        processList(globals);

        // B. Company (overrides Global)
        if (companyId) {
            const companySettings = settings.filter(s => s.scope === 'COMPANY');
            processList(companySettings);
        }

        // C. Site (overrides Company & Global)
        if (siteId) {
            const siteSettings = settings.filter(s => s.scope === 'SITE');
            processList(siteSettings);
        }

        res.json(Object.values(mergedSettings));
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSetting = async (req, res) => {
    try {
        const { key, value, type, scope, scopeId, category, description } = req.body;

        if (!key || scope === undefined) {
            return res.status(400).json({ error: 'Key and Scope are required' });
        }

        // Find existing or create
        const [setting, created] = await SystemSetting.findOrCreate({
            where: { key, scope, scopeId: scopeId || null },
            defaults: { value, type, category, description }
        });

        if (!created) {
            setting.value = value;
            if (type) setting.type = type;
            if (category) setting.category = category;
            if (description) setting.description = description;
            await setting.save();
        }

        res.json(setting);
    } catch (error) {
        console.error('Error saving setting:', error);
        res.status(500).json({ error: 'Failed to save setting' });
    }
};

export const deleteSettingOverride = async (req, res) => {
    try {
        const { id } = req.params;
        const setting = await SystemSetting.findByPk(id);

        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        // Prevent deleting GLOBAL settings if we want to ensure defaults always exist? 
        // Or simply allow delete and have code fallbacks. Let's allow delete for now.

        await setting.destroy();
        res.json({ message: 'Setting override removed' });
    } catch (error) {
        console.error('Error deleting setting:', error);
        res.status(500).json({ error: 'Failed to delete setting' });
    }
};
