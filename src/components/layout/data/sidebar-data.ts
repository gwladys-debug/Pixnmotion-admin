import {
  Camera,
  Command,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: "Pix'n Motion",
    email: 'pixnmotion.co@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: "Pix'n Motion",
      logo: Command,
      plan: 'Espace Administration',
    },
  ],
  navGroups: [
    {
      title: 'Gestion du contenu',
      items: [
        {
          title: 'Tableau de bord',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Ajouter des photos',
          url: '/photos/upload',
          icon: Camera,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          title: 'Paramètres',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}