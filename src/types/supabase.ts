export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      real_estate_ads: {
        Row: {
          id: number
          title: string | null
          description: string | null
          price: number
          price_per_square_meter: number
          surface: number
          building_floors: number | null
          type: string
          category: string
          creation_date: string
          reference: string | null
          location_id: number | null
          publisher_id: number | null
        }
      }
      locations: {
        Row: {
          id: number
          city: string
          region_code: string
          postal_code: string
          address: string
        }
      }
      pictures: {
        Row: {
          id: number
          ad_id: number
          picture_url: string
        }
      }
      options: {
        Row: {
          id: number
          ad_id: number
          name: string
          value: string | null
        }
      }
      publishers: {
        Row: {
          id: number
          name: string | null
          contact_info: Json | null
        }
      }
    }
  }
}