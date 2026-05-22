import { supabase } from "@/lib/supabase";

type MenuPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params;

  const { data } = await supabase
    .from("menus")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50">
        <h1 className="text-3xl font-bold">Menu not found</h1>
      </main>
    );
  }

  const menu = data.menu_data;

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-center text-6xl font-bold text-green-800">
          {menu.restaurantName}
        </h1>

        <p className="mt-3 text-center text-lg text-gray-500">
          AI-powered digital menu
        </p>

        <div className="mt-14 space-y-14">
          {menu.sections.map((section: any, index: number) => (
            <section key={index}>
              <h2 className="mb-6 border-b pb-3 text-4xl font-bold">
                {section.name}
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                {section.items.map((item: any, itemIndex: number) => (
                  <div
                    key={itemIndex}
                    className="rounded-3xl border border-green-100 bg-green-50 p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-3xl font-bold">{item.name}</h3>

                        <p className="mt-3 text-lg text-gray-600">
                          {item.description}
                        </p>

                        {item.tags && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.tags.map((tag: string, tagIndex: number) => (
                              <span
                                key={tagIndex}
                                className="rounded-full bg-white px-4 py-1 text-sm text-green-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-3xl font-bold text-green-700">
                        {item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}