
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS if needed for schema check
  )

  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching from attendance_logs:', error)
  } else {
    console.log('Sample record from attendance_logs:', data)
  }
}

checkSchema()
