import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

const templateDB = new SQLDatabase("templates", {
  migrations: "./migrations",
});

export interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  concernTypes: string[];
  severityLevel: string;
  templateContent: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: string;
  concernTypes: string[];
  severityLevel: string;
  templateContent: string;
  isPublic: boolean;
}

export interface UpdateTemplateRequest {
  id: number;
  name?: string;
  description?: string;
  category?: string;
  concernTypes?: string[];
  severityLevel?: string;
  templateContent?: string;
  isPublic?: boolean;
}

export interface ListTemplatesResponse {
  templates: Template[];
}

// Creates a new intervention template.
export const createTemplate = api<CreateTemplateRequest, Template>(
  { expose: true, method: "POST", path: "/templates", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    const template = await templateDB.queryRow<any>`
      INSERT INTO templates (
        name, description, category, concern_types, severity_level, 
        template_content, is_public, created_by, created_at, updated_at
      ) VALUES (
        ${req.name}, ${req.description}, ${req.category}, ${JSON.stringify(req.concernTypes)},
        ${req.severityLevel}, ${req.templateContent}, ${req.isPublic}, ${auth.email},
        NOW(), NOW()
      )
      RETURNING *
    `;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      concernTypes: JSON.parse(template.concern_types),
      severityLevel: template.severity_level,
      templateContent: template.template_content,
      isPublic: template.is_public,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    };
  }
);

// Lists all available templates.
export const listTemplates = api<void, ListTemplatesResponse>(
  { expose: true, method: "GET", path: "/templates", auth: true },
  async () => {
    const auth = getAuthData()!;

    const templates = await templateDB.queryAll<any>`
      SELECT * FROM templates 
      WHERE is_public = true OR created_by = ${auth.email}
      ORDER BY created_at DESC
    `;

    return {
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        concernTypes: JSON.parse(template.concern_types),
        severityLevel: template.severity_level,
        templateContent: template.template_content,
        isPublic: template.is_public,
        createdBy: template.created_by,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }))
    };
  }
);

// Updates an existing template.
export const updateTemplate = api<UpdateTemplateRequest, Template>(
  { expose: true, method: "PUT", path: "/templates/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    // Check if user owns the template or is admin
    const existing = await templateDB.queryRow<{ created_by: string }>`
      SELECT created_by FROM templates WHERE id = ${req.id}
    `;

    if (!existing) {
      throw APIError.notFound("Template not found");
    }

    if (existing.created_by !== auth.email && !auth.isAdmin) {
      throw APIError.permissionDenied("You can only edit your own templates");
    }

    const template = await templateDB.queryRow<any>`
      UPDATE templates SET
        name = COALESCE(${req.name || null}, name),
        description = COALESCE(${req.description || null}, description),
        category = COALESCE(${req.category || null}, category),
        concern_types = COALESCE(${req.concernTypes ? JSON.stringify(req.concernTypes) : null}, concern_types),
        severity_level = COALESCE(${req.severityLevel || null}, severity_level),
        template_content = COALESCE(${req.templateContent || null}, template_content),
        is_public = COALESCE(${req.isPublic !== undefined ? req.isPublic : null}, is_public),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING *
    `;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      concernTypes: JSON.parse(template.concern_types),
      severityLevel: template.severity_level,
      templateContent: template.template_content,
      isPublic: template.is_public,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    };
  }
);

// Deletes a template.
export const deleteTemplate = api<{ id: number }, { success: boolean }>(
  { expose: true, method: "DELETE", path: "/templates/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;

    // Check if user owns the template or is admin
    const existing = await templateDB.queryRow<{ created_by: string }>`
      SELECT created_by FROM templates WHERE id = ${req.id}
    `;

    if (!existing) {
      throw APIError.notFound("Template not found");
    }

    if (existing.created_by !== auth.email && !auth.isAdmin) {
      throw APIError.permissionDenied("You can only delete your own templates");
    }

    await templateDB.exec`DELETE FROM templates WHERE id = ${req.id}`;

    return { success: true };
  }
);
