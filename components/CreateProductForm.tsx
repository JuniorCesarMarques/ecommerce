"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createProductFormSchema } from "@/lib/schemas/createProduc";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

type ProductFormData = z.infer<typeof createProductFormSchema>;

export default function CreateProductForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(createProductFormSchema),
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const imageFile = watch("image");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Erro ao carregar categorias", err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  const onSubmit = async (data: any) => {
    try {
      const file = data.image[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogo")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("catalogo")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          description: data.description,
          price: Number(data.price),
          categoryId: data.categoryId,
          imageUrl,
          barcode: data.barcode,
        }),
      });

      if (!res.ok) await res.text();

      setSuccess(true);
      router.push("/products");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded-2xl shadow bg-white">
      <h1 className="text-2xl font-bold mb-6">Cadastrar Produto</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium">Nome</label>
          <input
            type="text"
            {...register("name")}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block font-medium mb-2">Tipo de embalagem</label>
          <select id="" {...register("type")} className="border p-2">
            <option value="">Selecione um tipo de embalagem</option>
            <option value="unidade">Unidade</option>
            <option value="caixa">Caixa</option>
            <option value="pacote">Pacote</option>
            <option value="quilo">Quilo</option>
            <option value="litro">Litro</option>
          </select>
          {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block font-medium">Descrição</label>
          <textarea
            {...register("description")}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Preço (R$)</label>
          <input
            type="text"
            {...register("price")}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.price && (
            <p className="text-red-500 text-sm">{errors.price.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700">
            Imagem do Produto
          </label>

          <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition">
            <input
              type="file"
              {...register("image")}
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="text-center pointer-events-none z-0">
              <p className="text-sm text-zinc-500">
                Clique para selecionar uma imagem
              </p>
              <p className="text-xs text-zinc-400">JPG, PNG ou WEBP até 5MB</p>
            </div>
          </div>

          {preview && (
            <div className="relative w-40">
              <button
                className="absolute right-3 top-3"
                onClick={() => {
                  setPreview(null);
                  reset({ image: null });
                }}
              >
                X
              </button>
              <img
                src={preview}
                alt="Pré-visualização"
                className="mt-2 rounded-lg border"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block font-medium">Categoria</label>
          <select
            {...register("categoryId")}
            className="w-full border px-3 py-2 rounded bg-white"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {errors.categoryId && (
            <p className="text-red-500 text-sm">{errors.categoryId.message}</p>
          )}
        </div>
        <div>
          <label className="block font-medium">EAN</label>
          <input
            type="text"
            {...register("barcode")}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.barcode && (
            <p className="text-red-500 text-sm">{errors.barcode.message}</p>
          )}
        </div>

        <div className="text-center">
          <Button
            disabled={isSubmitting}
            className="bg-primary text-white px-6 py-2 rounded"
          >
            {isSubmitting ? "Enviando..." : "Cadastrar"}
          </Button>
        </div>

        {success && (
          <p className="text-green-600 mt-2">Produto criado com sucesso!</p>
        )}
      </form>
    </div>
  );
}
