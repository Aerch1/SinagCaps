import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../../context/admin/SidebarContext";

// lucide-react icons (swap if you have your own)
import {
  LayoutGrid as GridIcon,
  Calendar as CalendarIcon,
  UserCircle2 as UserCircleIcon,
  List as ListIcon,
  Table as TableIcon,
  File as PageIcon,
  PieChart as PieChartIcon,
  Box as BoxCubeIcon,
  Plug as PlugInIcon,
  ChevronDown,
  MoreHorizontal as HorizontalDots,
} from "lucide-react";

const navItems = [
  { icon: <GridIcon size={18} />, name: "Dashboard", subItems: [{ name: "Ecommerce", path: "/admin", pro: false }] },
  { icon: <CalendarIcon size={18} />, name: "Calendar", path: "/admin/calendar" },
  { icon: <UserCircleIcon size={18} />, name: "User Profile", path: "/admin/profile" },
  { name: "Forms", icon: <ListIcon size={18} />, subItems: [{ name: "Form Elements", path: "/admin/form-elements", pro: false }] },
  { name: "Tables", icon: <TableIcon size={18} />, subItems: [{ name: "Basic Tables", path: "/admin/basic-tables", pro: false }] },
  {
    name: "Pages",
    icon: <PageIcon size={18} />,
    subItems: [
      { name: "Blank Page", path: "/admin/blank", pro: false },
      { name: "404 Error", path: "/admin/error-404", pro: false },
    ],
  },
];

const othersItems = [
  {
    icon: <PieChartIcon size={18} />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/admin/line-chart", pro: false },
      { name: "Bar Chart", path: "/admin/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon size={18} />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/admin/alerts", pro: false },
      { name: "Avatar", path: "/admin/avatars", pro: false },
      { name: "Badge", path: "/admin/badge", pro: false },
      { name: "Buttons", path: "/admin/buttons", pro: false },
      { name: "Images", path: "/admin/images", pro: false },
      { name: "Videos", path: "/admin/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon size={18} />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null); // { type: 'main'|'others', index } | null
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({}); // key: `${type}-${idx}` -> HTMLDivElement

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  // open correct submenu for current route
  useEffect(() => {
    let matched = false;
    [
      { items: navItems, type: "main" },
      { items: othersItems, type: "others" },
    ].forEach(({ items, type }) => {
      items.forEach((nav, index) => {
        (nav.subItems || []).forEach((sub) => {
          if (isActive(sub.path)) {
            setOpenSubmenu({ type, index });
            matched = true;
          }
        });
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [location, isActive]);

  // measure submenu height for smooth accordion
  useEffect(() => {
    if (!openSubmenu) return;
    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const el = subMenuRefs.current[key];
    if (el) setSubMenuHeight((prev) => ({ ...prev, [key]: el.scrollHeight || 0 }));
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, type) => {
    setOpenSubmenu((prev) => (prev && prev.type === type && prev.index === index ? null : { type, index }));
  };

  const BaseItemClasses =
    "relative group flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-[14px] leading-5";
  const InactiveItemClasses =
    "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";
  const ActiveItemClasses =
    "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400";

  const IconInactive =
    "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300";
  const IconActive = "text-brand-500 dark:text-brand-400";

  const DropdownItemBase =
    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium";
  const DropdownActive =
    "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400";
  const DropdownInactive =
    "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";

  const BadgeBase =
    "block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase text-brand-500 dark:text-brand-400";
  const BadgeActive = "bg-brand-100 dark:bg-brand-500/20";
  const BadgeInactive = "bg-brand-50 group-hover:bg-brand-100 dark:bg-brand-500/15 dark:group-hover:bg-brand-500/20";

  const renderMenu = (items, type) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const open = openSubmenu?.type === type && openSubmenu?.index === index;

        return (
          <li key={`${type}-${nav.name}`}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, type)}
                className={`${BaseItemClasses} ${open ? ActiveItemClasses : InactiveItemClasses} ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span className={`${open ? IconActive : IconInactive}`}>{nav.icon}</span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="truncate">{nav.name}</span>
                    <ChevronDown
                      className={`ml-auto  h-5 w-5 transition-transform duration-200 ${open ? "rotate-180 text-brand-500" : ""}`}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`${BaseItemClasses} ${isActive(nav.path) ? ActiveItemClasses : InactiveItemClasses}`}
                >
                  <span className={`${isActive(nav.path) ? IconActive : IconInactive}`}>{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && <span className="truncate">{nav.name}</span>}
                </Link>
              )
            )}

            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => (subMenuRefs.current[`${type}-${index}`] = el)}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: open ? `${subMenuHeight[`${type}-${index}`] || 0}px` : "0px",
                }}
              >
                <ul className="ml-9 mt-2 space-y-1">
                  {nav.subItems.map((sub) => {
                    const active = isActive(sub.path);
                    return (
                      <li key={`${type}-${nav.name}-${sub.name}`}>
                        <Link
                          to={sub.path}
                          className={`${DropdownItemBase} ${active ? DropdownActive : DropdownInactive} group`}
                        >
                          {sub.name}
                          <span className="ml-auto flex items-center gap-1">
                            {sub.new && (
                              <span className={`${BadgeBase} ${active ? BadgeActive : BadgeInactive}`}>new</span>
                            )}
                            {sub.pro && (
                              <span className={`${BadgeBase} ${active ? BadgeActive : BadgeInactive}`}>pro</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:mt-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 ${!isExpanded && !isHovered ? "lg:flex lg:justify-center" : ""}`}>
        <Link to="/admin">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-5 text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontalDots className="h-5 w-5" />}
              </h2>
              {renderMenu(navItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-5 text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontalDots className="h-5 w-5" />}
              </h2>
              {renderMenu(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
