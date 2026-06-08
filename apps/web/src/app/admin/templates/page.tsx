"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type Template = {
  id:string;
  title:string;
  category:string;
  content:string;
  isActive:boolean;
};

export default function AdminTemplatesPage() {
  const { activeHospital } = useHospital();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({
    title:"",
    category:"",
    content:""
  });

  async function load() {
    setTemplates(
      await apiFetch<Template[]>("/admin/templates")
    );
  }

  useEffect(() => {
    if (!activeHospital) return;
    void load();
  }, [activeHospital]);

  async function createTemplate() {
    await apiFetch("/admin/templates", {
      method:"POST",
      body:JSON.stringify(form)
    });
    setForm({ title:"", category:"", content:"" });
    await load();
  }

  async function updateTemplate(template:Template) {
    await apiFetch(`/admin/templates/${template.id}`, {
      method:"PATCH",
      body:JSON.stringify(template)
    });
    await load();
  }

  async function deleteTemplate(id:string) {
    await apiFetch(`/admin/templates/${id}`, {
      method:"DELETE"
    });
    await load();
  }

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_TEMPLATES}>
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Templates</h2>
          <p className="mt-1 text-sm text-slate-600">
            CRUD foundation for reusable operational templates.
          </p>
        </div>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_220px_2fr_auto]">
          <Input placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title:event.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category:event.target.value })} />
          <Input placeholder="Content" value={form.content} onChange={(event) => setForm({ ...form, content:event.target.value })} />
          <Button onClick={createTemplate}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="grid gap-3">
          {templates.map((template) => (
            <article
              key={template.id}
              className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px_2fr_auto]"
            >
              <Input value={template.title} onChange={(event) => updateTemplateState(template.id, "title", event.target.value, setTemplates)} />
              <Input value={template.category} onChange={(event) => updateTemplateState(template.id, "category", event.target.value, setTemplates)} />
              <Input value={template.content} onChange={(event) => updateTemplateState(template.id, "content", event.target.value, setTemplates)} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => updateTemplate(template)} aria-label="Save template">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="destructive" onClick={() => deleteTemplate(template.id)} aria-label="Deactivate template">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PermissionGate>
  );
}

function updateTemplateState(
  id:string,
  field:keyof Template,
  value:string,
  setTemplates:React.Dispatch<React.SetStateAction<Template[]>>
) {
  setTemplates((current) =>
    current.map((template) =>
      template.id === id
        ? { ...template, [field]:value }
        : template
    )
  );
}
