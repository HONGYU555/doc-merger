import axios from 'axios'

export interface MergeResponse {
  id: string
  filename: string
  size: number
  fileCount: number
  format: 'docx' | 'txt'
}

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export async function mergeFiles(formData: FormData): Promise<MergeResponse> {
  const { data } = await api.post<MergeResponse>('/merge', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
