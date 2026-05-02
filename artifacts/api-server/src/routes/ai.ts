import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { employees, departments, branches } from "@workspace/db";
import { ilike, or, eq } from "drizzle-orm";
import {
  GenerateEmployeeSummaryBody,
  SmartSearchBody,
} from "@workspace/api-zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
  baseURL: process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1",
});

router.post("/ai/generate-summary", async (req, res) => {
  try {
    const body = GenerateEmployeeSummaryBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const { fullName, jobTitle, department, branch, dateOfEmployment } = body.data;

    const yearsOfService = dateOfEmployment
      ? Math.floor(
          (Date.now() - new Date(dateOfEmployment).getTime()) /
            (1000 * 60 * 60 * 24 * 365),
        )
      : null;

    const prompt = `Generate a concise, professional 2-3 sentence bio for an employee profile:
Name: ${fullName}
Role: ${jobTitle}
Department: ${department}
${branch ? `Branch: ${branch}` : ""}
${yearsOfService !== null ? `Years of service: ${yearsOfService}` : ""}

Write in third person. Focus on their role and value to the organization. Keep it professional and positive.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ summary });
  } catch (err) {
    req.log.error({ err }, "Failed to generate summary");
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

router.post("/ai/smart-search", async (req, res) => {
  try {
    const body = SmartSearchBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const { query } = body.data;

    const extractionPrompt = `Given this natural language search query for an employee management system, extract key search terms (names, job titles, departments, keywords). Return only a JSON object with: {"terms": ["term1", "term2"]}. Query: "${query}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: extractionPrompt }],
      max_tokens: 100,
      response_format: { type: "json_object" },
    });

    let terms: string[] = [query];
    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
      if (Array.isArray(parsed.terms) && parsed.terms.length > 0) {
        terms = parsed.terms;
      }
    } catch {
      terms = [query];
    }

    const conditions = terms.flatMap((term) => [
      ilike(employees.fullName, `%${term}%`),
      ilike(employees.jobTitle, `%${term}%`),
      ilike(employees.email, `%${term}%`),
      ilike(departments.name, `%${term}%`),
      ilike(branches.name, `%${term}%`),
    ]);

    const rows = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
        jobTitle: employees.jobTitle,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        branchId: employees.branchId,
        branchName: branches.name,
        phone: employees.phone,
        email: employees.email,
        dateOfEmployment: employees.dateOfEmployment,
        status: employees.status,
        photoUrl: employees.photoUrl,
        summary: employees.summary,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .where(or(...conditions))
      .limit(20);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to smart search");
    res.status(500).json({ error: "Failed to smart search" });
  }
});

export default router;
