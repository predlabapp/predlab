import { Prediction as PrismaPrediction, Category, Resolution } from "@prisma/client"
import "next-auth"

export type Prediction = PrismaPrediction
export { Category, Resolution }

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
    }
  }
}
