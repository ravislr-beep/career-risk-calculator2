const supabaseAdmin = getSupabaseAdmin()
const { data, error } = await supabaseAdmin.auth.getUser(token)
const user = data?.user
if (!user) return res.status(200).json({ isAdmin: false })

const { data: appUser } = await supabaseAdmin
  .from('app_users')
  .select('*')
  .eq('id', user.id)
  .single()

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const isAdmin =
  adminEmails.includes(user.email ?? '') || appUser?.is_admin === true

return res.status(200).json({ isAdmin })
