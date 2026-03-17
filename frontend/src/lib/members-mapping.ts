export type MemberUserProfile = {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  nik?: string
  phone?: string
  mobile?: string
  profile_photo_url?: string
  search_name?: string
  jenis_kelamin?: string
  agama?: string
  is_active?: boolean
}

export type MemberBiodata = {
  nik?: string
  nama?: string
  nickname?: string
  jenis_kelamin?: string
  agama?: string
}

export type MemberDepartment = { name?: string }

export type MemberLike = {
  user?: MemberUserProfile
  biodata?: MemberBiodata
  departments?: MemberDepartment | MemberDepartment[]
  groupName?: string
  biodata_nik?: string
}

function firstDepartment(dep?: MemberDepartment | MemberDepartment[] | null): MemberDepartment | undefined {
  if (!dep) return undefined
  return Array.isArray(dep) ? dep[0] : dep
}

export function computeName(m: MemberLike): string {
  const displayName = (m.user?.display_name ?? '').trim()
  const firstName = (m.user?.first_name ?? '').trim()
  const lastName = (m.user?.last_name ?? '').trim()
  const email = (m.user?.email ?? '').trim()
  const searchName = (m.user?.search_name ?? '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const biodataNama = (m.biodata?.nama ?? '').trim()
  const biodataNickname = (m.biodata?.nickname ?? '').trim()
  return displayName || fullName || email || searchName || biodataNama || biodataNickname || 'No Name'
}

export function computeNik(m: MemberLike): string {
  const nikUser = (m.user?.nik ?? '').trim()
  const nikBio = (m.biodata?.nik ?? '').trim()
  const nikAlt = (m.biodata_nik ?? '').trim()
  return nikUser || nikBio || nikAlt || '-'
}

export function computeGroupName(m: MemberLike): string {
  if (m.groupName) return m.groupName
  const dep = firstDepartment(m.departments)
  return dep?.name ?? '-'
}

export function computeGender(m: MemberLike): string {
  return m.user?.jenis_kelamin || m.biodata?.jenis_kelamin || '-'
}

export function computeReligion(m: MemberLike): string {
  return m.user?.agama || m.biodata?.agama || '-'
}
