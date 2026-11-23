import { ProductEditor } from "@/components/admin/product-editor"

export const metadata = { title: "Edit product" }

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  return <ProductEditor key={id} id={id} />
}
