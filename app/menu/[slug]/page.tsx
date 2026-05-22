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
  const logoUrl = data.logo_url;
  const bannerUrl = data.banner_url;
  const themeColor = data.theme_color || "#16a34a";

  return (
    <main className="min-h-screen bg-green-50 px-4 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl">
        {bannerUrl && (
          <div
            className="h-44 bg-cover bg-center sm:h-72"
            style={{
              backgroundImage: `url(${bannerUrl})`,
            }}
          />
        )}

        <div className="p-5 sm:p-10">
          {logoUrl && (
            <div className="-mt-20 mb-6 flex justify-center sm:-mt-24">
              <img
                src={logoUrl}
                alt="Restaurant logo"
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl sm:h-36 sm:w-36"
              />
            </div>
          )}

          <h1
            className="text-center text-4xl font-bold sm:text-6xl"
            style={{ color: themeColor }}
          >
            {menu.restaurantName}
          </h1>

          <p className="mt-3 text-center text-base text-gray-500 sm:text-lg">
            AI-powered digital menu
          </p>

          <div className="mt-10 space-y-10 sm:mt-14 sm:space-y-14">
            {menu.sections.map((section: any, index: number) => (
              <section key={index}>
                <h2
                  className="mb-5 border-b pb-3 text-3xl font-bold sm:mb-6 sm:text-4xl"
                  style={{ color: themeColor }}
                >
                  {section.name}
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  {section.items.map((item: any, itemIndex: number) => (
                    <div
                      key={itemIndex}
                      className="rounded-3xl border border-green-100 bg-green-50 p-5 sm:p-7"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold sm:text-3xl">
                            {item.name}
                          </h3>

                          <p className="mt-3 text-base text-gray-600 sm:text-lg">
                            {item.description}
                          </p>

                          {item.tags && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.tags.map(
                                (tag: string, tagIndex: number) => (
                                  <span
                                    key={tagIndex}
                                    className="rounded-full bg-white px-4 py-1 text-sm"
                                    style={{ color: themeColor }}
                                  >
                                    {tag}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <span
                          className="text-2xl font-bold sm:text-3xl"
                          style={{ color: themeColor }}
                        >
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
      </div>
    </main>
  );
}