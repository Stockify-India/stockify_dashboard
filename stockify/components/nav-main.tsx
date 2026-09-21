"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, MailIcon } from "lucide-react"

const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const

function isItemActive(url: string, pathname: string) {
  if (url === "/dashboard" && pathname === "/") return true
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <CirclePlusIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>

            <Button
              size="icon"
              className="size-8 transition-transform group-data-[collapsible=icon]:opacity-0 active:scale-[0.95]"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item, index) => {
            const active = isItemActive(item.url, pathname)
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: index * 0.04 }}
              >
                <SidebarMenuItem className="relative">
                  {active && (
                    <motion.span
                      layoutId="nav-main-active"
                      className="absolute inset-0 rounded-md bg-sidebar-accent"
                      transition={SPRING}
                    />
                  )}
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={active}
                    render={<Link href={item.url} />}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                    className="relative data-active:bg-transparent! [&_svg]:transition-transform [&_svg]:duration-200 group-hover/menu-button:[&_svg]:translate-x-0.5"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}