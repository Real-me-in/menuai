import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: menu } = await supabase
    .from("menus")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!menu) {
    return <div className="p-10 text-center text-2xl">Menu not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
        {menu.logo_url && (
          <img
            src={menu.logo_url}
            alt="Restaurant Logo"
            className="mx-auto mb-4 h-28 w-28 rounded-full border object-cover shadow"
          />
        )}

        <h1 className="mb-8 text-center text-4xl font-bold">
          {menu.restaurant_name}
        </h1>

        {menu.menu_data?.sections?.map((section: any, index: number) => (
          <div key={index} className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-2xl font-semibold">
              {section.name}
            </h2>

            <div className="space-y-4">
              {section.items?.map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="rounded-xl border p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>

                    <div className="font-bold">₹{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}