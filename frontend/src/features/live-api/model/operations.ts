import { z } from 'zod'
import { formInputSchema, type FormAction, type FormField } from '@/shared/model/form-action'
import { authActions, type AuthActionId } from '@/features/auth'
import { hotelResponseSchema, hotelPageResponseSchema } from '@/features/hotels'

z.config(z.locales.vi())

type Field = FormField
interface HttpOperation extends FormAction {
  kind: 'http'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: (values: Record<string, string>) => string
  response: z.ZodType
  body?: (values: Record<string, string>) => unknown
}
interface AuthOperation extends FormAction {
  kind: 'auth'
  id: AuthActionId
  method: 'GET' | 'POST'
}
export type Operation = HttpOperation | AuthOperation

const required = z.string().trim().min(1, 'Vui lòng nhập giá trị.')
const uuid = z.string().uuid('Nhập UUID hợp lệ.')
const integer = (min: number, max: number) => required.refine(
  (value) => /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max,
  'Nhập số nguyên từ ' + min + ' đến ' + max + '.',
)
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Nhập giờ HH:mm.')
const instant = required.refine(
  (value) => /Z$|[+-]\d{2}:\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
  'Nhập ISO 8601 có múi giờ, ví dụ 2026-11-05T14:00:00+07:00.',
)
const hotel = hotelResponseSchema
const page = hotelPageResponseSchema
const userRoles = z.object({ userId: uuid, roles: z.array(z.string()) })
const f = (key: string, label: string, rule: FormField['rule'] = required, initial?: string): Field =>
  ({ key, label, rule, initial, secret: /password|token/i.test(key) })
const hotels = 'Khách sạn & phòng'
const roles = 'Vai trò (ADMIN)'
const hotelId = f('hotelId', 'ID khách sạn', uuid)
const userId = f('userId', 'ID tài khoản', uuid)
const roleId = f('roleId', 'ID vai trò (số)', integer(1, 2147483647))
const hotelPath = (values: Record<string, string>) => '/management/hotels/' + encodeURIComponent(values.hotelId)
const rolePath = (values: Record<string, string>) => '/admin/users/' + encodeURIComponent(values.userId) + '/roles'

const httpOperations: Omit<HttpOperation, 'kind'>[] = [
  {
    id: 'hotels',
    title: 'Danh sách khách sạn',
    group: hotels,
    method: 'GET',
    path: (v) => '/management/hotels?page=' + v.page + '&size=' + v.size,
    fields: [
      f('page', 'Trang (bắt đầu từ 0)', integer(0, 2147483647), '0'),
      f('size', 'Số bản ghi', integer(1, 100), '20'),
    ],
    response: page,
    authenticated: true,
  },
  {
    id: 'hotel',
    title: 'Chi tiết khách sạn',
    group: hotels,
    method: 'GET',
    path: hotelPath,
    fields: [hotelId],
    response: hotel,
    authenticated: true,
  },
  {
    id: 'create-hotel',
    title: 'Tạo khách sạn (ADMIN)',
    group: hotels,
    method: 'POST',
    path: () => '/management/hotels',
    fields: [
      f('ownerId', 'ID chủ sở hữu', uuid),
      f('cityId', 'ID thành phố', uuid),
      f('name', 'Tên khách sạn', required.max(255)),
      f('address', 'Địa chỉ', required.max(255)),
      f('description', 'Mô tả (tùy chọn)', z.string()),
      f('starRating', 'Hạng sao', integer(1, 5), '3'),
      f('checkInTime', 'Giờ nhận phòng', time, '14:00'),
      f('checkOutTime', 'Giờ trả phòng', time, '12:00'),
    ],
    body: (v) => ({ ...v, starRating: Number(v.starRating) }),
    response: hotel,
    authenticated: true,
  },
  {
    id: 'room-type',
    title: 'Tạo loại phòng',
    group: hotels,
    method: 'POST',
    path: (v) => hotelPath(v) + '/room-types',
    fields: [
      hotelId,
      f('name', 'Tên loại phòng', required.max(100)),
      f('description', 'Mô tả (tùy chọn)', z.string()),
      f('maxAdults', 'Số người lớn tối đa', integer(1, 32767), '2'),
      f('maxChildren', 'Số trẻ em tối đa', integer(0, 32767), '0'),
    ],
    body: (v) => ({
      name: v.name,
      description: v.description,
      maxAdults: Number(v.maxAdults),
      maxChildren: Number(v.maxChildren),
    }),
    response: z.object({
      id: uuid,
      hotelId: uuid,
      name: z.string(),
      description: z.string().nullable(),
      maxAdults: z.number(),
      maxChildren: z.number(),
      active: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
      version: z.number(),
    }),
    authenticated: true,
  },
  {
    id: 'room',
    title: 'Tạo phòng vật lý',
    group: hotels,
    method: 'POST',
    path: (v) => hotelPath(v) + '/rooms',
    fields: [
      hotelId,
      f('roomTypeId', 'ID loại phòng', uuid),
      f('roomNumber', 'Số phòng', required.max(20)),
      f('floor', 'Tầng (tùy chọn)', z.string().max(20)),
      f('operationalFrom', 'Bắt đầu phục vụ (ISO 8601)', instant),
      f(
        'operationalUntil',
        'Kết thúc phục vụ (tùy chọn)',
        z.union([z.literal(''), instant]),
      ),
    ],
    body: (v) => ({
      roomTypeId: v.roomTypeId,
      roomNumber: v.roomNumber,
      floor: v.floor || null,
      operationalFrom: v.operationalFrom,
      operationalUntil: v.operationalUntil || null,
    }),
    response: z
      .object({
        id: uuid,
        hotelId: uuid,
        roomTypeId: uuid,
        roomNumber: z.string(),
        floor: z.string().nullable(),
        readiness: z.string(),
        operationalFrom: z.string(),
        operationalUntil: z.string().nullable(),
        version: z.number(),
      })
      .passthrough(),
    authenticated: true,
  },
  {
    id: 'roles',
    title: 'Danh sách vai trò',
    group: roles,
    method: 'GET',
    path: () => '/admin/roles',
    fields: [],
    response: z.array(
      z.object({ id: z.number(), roleKey: z.string(), roleName: z.string() }),
    ),
    authenticated: true,
  },
  {
    id: 'user-roles',
    title: 'Vai trò của tài khoản',
    group: roles,
    method: 'GET',
    path: rolePath,
    fields: [userId],
    response: userRoles,
    authenticated: true,
  },
  {
    id: 'grant-role',
    title: 'Cấp vai trò',
    group: roles,
    method: 'PUT',
    path: (v) => rolePath(v) + '/' + v.roleId,
    fields: [userId, roleId],
    response: userRoles,
    authenticated: true,
  },
  {
    id: 'revoke-role',
    title: 'Thu hồi vai trò',
    group: roles,
    method: 'DELETE',
    path: (v) => rolePath(v) + '/' + v.roleId,
    fields: [userId, roleId],
    response: userRoles,
    authenticated: true,
  },
]

export const operations: Operation[] = [
  ...authActions.map((action): AuthOperation => ({ ...action, kind: 'auth', method: action.id === 'me' ? 'GET' : 'POST' })),
  ...httpOperations.map((operation): HttpOperation => ({ ...operation, kind: 'http' })),
]

export const inputSchema = formInputSchema
