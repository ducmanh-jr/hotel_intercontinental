export interface HotelDetailItem {
  id: string
  title: string
  city: string
  location: string
  type: string
  hostName: string
  hostAvatar: string
  hostBio: string
  price: number
  rating: number
  reviews: number
  specs: string[]
  sleepDesc: string
  photos: string[]
  desc: string[]
  cleaningFee: number
  serviceFee: number
  discount: number
}

export const HOTEL_DETAIL_DATABASE: Record<string, HotelDetailItem> = {
  'the-lagom': {
    id: 'the-lagom',
    title: 'The Lagom Room | Cozy Compact Studio · Quận 1',
    city: 'Quận 1, TP. Hồ Chí Minh',
    location: 'Hẻm Cô Giang, Quận 1, Thành phố Hồ Chí Minh, Việt Nam',
    type: 'Toàn bộ căn hộ studio · Co-living Kolab',
    hostName: 'Jonas & Vân Anh',
    hostAvatar: '/assets/client/sapa.jpg',
    hostBio:
      'Chúng tôi là Jonas và Vân Anh. Là những người đam mê kiến trúc tối giản và lối sống Lagom "vừa đủ", chúng tôi tạo nên The Lagom Room để mang đến một chốn dừng chân bình yên, tiện nghi giữa nhịp sống sôi động của Sài Gòn.',
    price: 890000,
    rating: 4.92,
    reviews: 128,
    specs: [
      '2 khách',
      '1 phòng ngủ',
      '1 giường đôi (1m4)',
      '1 phòng tắm riêng',
      'Bàn làm việc chuyên dụng',
    ],
    sleepDesc: '1 giường đôi (1m4 x 2m), đệm cao su êm ái, ga gối cotton tự nhiên.',
    photos: [
      '/assets/client/hotel-garden.jpg',
      '/assets/client/hotel-pine.jpg',
      '/assets/client/hotel-heritage.jpg',
      '/assets/client/hotel-coast.jpg',
      '/assets/client/experience.jpg',
    ],
    desc: [
      'The Lagom Room được lấy cảm hứng từ triết lý "Lagom" của Thụy Điển – không quá nhiều, không quá ít, vừa đủ để tạo nên sự cân bằng hoàn hảo. Tọa lạc trong một con hẻm văn hóa yên tĩnh ngay trung tâm Quận 1 phồn hoa, đây là không gian lý tưởng cho người làm việc từ xa, các chuyến công tác hoặc khách du lịch một mình tìm kiếm chốn an yên giữa lòng Sài Gòn.',
      'Căn studio được thiết kế thông minh với ánh sáng tự nhiên ngập tràn, giường ngủ đệm cao su tự nhiên êm ái, điều hòa Daikin inverter tĩnh lặng, và đặc biệt là góc làm việc chuyên dụng với ghế công thái học và kết nối Wi-Fi 150 Mbps ổn định.',
      'Tầng trệt có khu co-living kết nối cùng máy pha cà phê, máy giặt sấy hiện đại và không gian tiếp khách thân mật.',
    ],
    cleaningFee: 150000,
    serviceFee: 120000,
    discount: 80000,
  },
  'cloud-pine': {
    id: 'cloud-pine',
    title: 'Cloud Pine Glamping & Wooden Villa | Săn mây · Đà Lạt',
    city: 'Đà Lạt, Lâm Đồng',
    location: 'Đồi Đa Phú · cách trung tâm Đà Lạt 4,2 km',
    type: 'Căn lều Panorama & Nhà gỗ thông view thung lũng mây',
    hostName: 'Bảo Nam & Thu Hà',
    hostAvatar: '/assets/client/dalat.jpg',
    hostBio:
      'Chúng mình sinh ra và lớn lên tại xứ sở sương mù Đà Lạt. Cloud Pine là tâm huyết lưu giữ vẻ đẹp hoang sơ của đồi thông, hương khói chiều và văn hóa lửa trại ấm áp bên những người bạn phương xa.',
    price: 1390000,
    rating: 4.9,
    reviews: 328,
    specs: [
      '2 khách',
      '1 phòng ngủ lều',
      '1 giường King',
      'Ban công mây',
      'Lửa trại acoustic',
    ],
    sleepDesc: '1 giường King size (1m8 x 2m), chăn đệm sưởi ấm nhiệt độ cao nguyên.',
    photos: [
      '/assets/client/glamping.jpg',
      '/assets/client/hotel-pine.jpg',
      '/assets/client/dalat.jpg',
      '/assets/client/experience.jpg',
      '/assets/client/hotel-garden.jpg',
    ],
    desc: [
      'Một cụm lều Panorama nằm dưới tán rừng thông nguyên sinh Đồi Đa Phú, nơi bạn có thể thức giấc trong mùi sương sớm se lạnh và ngắm biển mây cuồn cuộn dưới thung lũng lúc sáu giờ sáng.',
      'Buổi tối có lửa trại acoustic, khoai nướng, trà atiso ấm nóng và không gian thưởng ngoạn bầu trời ngàn sao tách biệt khỏi mọi ồn ào phố thị.',
      'Bao gồm bữa sáng hữu cơ và quầy cà phê thủ công tự phục vụ tại sảnh nhà gỗ trung tâm.',
    ],
    cleaningFee: 180000,
    serviceFee: 140000,
    discount: 100000,
  },
  'an-nhien': {
    id: 'an-nhien',
    title: 'An Nhiên Beach House | Nhà gỗ ven biển · Phú Quốc',
    city: 'Phú Quốc, Kiên Giang',
    location: 'Bãi Trường · 6 phút đi bộ ra bãi biển',
    type: 'Toàn bộ biệt thự ven biển có hồ bơi riêng',
    hostName: 'Minh Hoàng',
    hostAvatar: '/assets/client/phuquoc.jpg',
    hostBio:
      'Rời phố thị về với biển đảo Phú Quốc, mình mong muốn An Nhiên là chốn để bạn cởi dép, đi chân trần trên cát trắng và nghe trọn vẹn nhịp thở của đại dương.',
    price: 2450000,
    rating: 4.88,
    reviews: 214,
    specs: [
      '4 khách',
      '2 phòng ngủ',
      '2 giường Queen',
      'Hồ bơi riêng',
      'Bãi tắm riêng',
    ],
    sleepDesc: '2 giường Queen cao cấp nhìn thẳng ra vườn nhiệt đới và hồ bơi.',
    photos: [
      '/assets/client/hotel-coast.jpg',
      '/assets/client/phuquoc.jpg',
      '/assets/resort-b.jpg',
      '/assets/client/hotel-garden.jpg',
      '/assets/client/experience.jpg',
    ],
    desc: [
      'Những căn nhà gỗ mộc mạc mở thẳng ra bãi biển cát mịn Bãi Trường. Hồ bơi riêng xanh ngọc bích hòa cùng màu biển, khoảng hiên rộng đón gió biển mát lành và ngắm trọn vẹn hoàng hôn buông đỏ rực.',
      'Đầy đủ bếp nướng BBQ hải sản ngoài trời, thuyền kayak miễn phí và dịch vụ xe đưa đón sân bay chu đáo.',
    ],
    cleaningFee: 250000,
    serviceFee: 200000,
    discount: 150000,
  },
  'may-heritage': {
    id: 'may-heritage',
    title: 'Mây Heritage Suites | Dấu ấn Indochine · Đà Nẵng',
    city: 'Đà Nẵng',
    location: 'Ven sông Hàn · 1,2 km tới phố cổ & Cầu Rồng',
    type: 'Căn hộ di sản cao cấp phong cách Đông Dương',
    hostName: 'Thanh Trúc',
    hostAvatar: '/assets/client/hoian.jpg',
    hostBio:
      'Say mê những nếp nhà cổ và gạch bông Indochine, mình phục dựng Mây Heritage để mang đến cảm giác hoài niệm nhưng đầy đủ tiện nghi đương đại.',
    price: 1890000,
    rating: 4.91,
    reviews: 182,
    specs: [
      '3 khách',
      '1 phòng ngủ lớn',
      '1 giường King',
      'Ban công sông Hàn',
      'Bồn tắm gỗ pơ-mu',
    ],
    sleepDesc: '1 giường King gỗ gõ đỏ chạm khắc thủ công, đệm lò xo túi êm ái.',
    photos: [
      '/assets/client/hotel-heritage.jpg',
      '/assets/client/hoian.jpg',
      '/assets/client/hotel-garden.jpg',
      '/assets/resort-warm.jpg',
      '/assets/client/experience.jpg',
    ],
    desc: [
      'Căn suite đậm chất Đông Dương với gạch bông thủ công, đồ gỗ tiện mộc và ban công lộng gió ngắm dòng sông Hàn thơ mộng.',
      'Phòng tắm rộng với bồn tắm ngâm thảo mộc bằng gỗ pơ-mu, tinh dầu sả quế dịu nhẹ mang lại những phút giây thư giãn tuyệt đối.',
    ],
    cleaningFee: 200000,
    serviceFee: 160000,
    discount: 90000,
  },
  'field-house': {
    id: 'field-house',
    title: 'The Field House | Nhà sàn giữa thung lũng · Sa Pa',
    city: 'Sa Pa, Lào Cai',
    location: 'Bản Tả Van · nhìn ra thung lũng Mường Hoa',
    type: 'Nhà sàn gỗ pơ-mu bản địa view ruộng bậc thang',
    hostName: 'A Súa & Mai Chi',
    hostAvatar: '/assets/client/sapa.jpg',
    hostBio:
      'Chúng mình yêu từng thửa ruộng bậc thang mùa lúa chín và tiếng suối róc rách của Tả Van. The Field House chào đón bạn như người thân trong gia đình.',
    price: 1290000,
    rating: 4.85,
    reviews: 146,
    specs: [
      '2 khách',
      '1 phòng ngủ gác mái',
      '1 giường lớn',
      'Lò sưởi củi',
      'Tắm lá thuốc người Dao',
    ],
    sleepDesc: '1 đệm futon kiểu Nhật trên sàn gỗ pơ-mu thơm tự nhiên.',
    photos: [
      '/assets/client/sapa.jpg',
      '/assets/client/hotel-pine.jpg',
      '/assets/client/hotel-heritage.jpg',
      '/assets/client/glamping.jpg',
      '/assets/client/experience.jpg',
    ],
    desc: [
      'Căn nhà sàn mộc mạc nằm bên sườn đồi bản Tả Van, mở mắt ra là bức tranh thủy mặc của thung lũng ruộng bậc thang Mường Hoa.',
      'Tối về bên lò sưởi củi tí tách, thưởng thức món ăn bản địa ấm cúng và ngâm bồn lá thuốc Dao đỏ giúp giải tỏa mọi mệt mỏi.',
    ],
    cleaningFee: 150000,
    serviceFee: 110000,
    discount: 70000,
  },
  'lang-chai': {
    id: 'lang-chai',
    title: 'Làng Chài Hideaway | Villa mộc ven biển · Phú Quốc',
    city: 'Phú Quốc, Kiên Giang',
    location: 'Làng chài Hàm Ninh · ven biển yên tĩnh',
    type: 'Biệt thự mộc ven biển liền kề làng chài cổ',
    hostName: 'Quốc Việt',
    hostAvatar: '/assets/client/phuquoc.jpg',
    hostBio:
      'Gia đình mình gắn bó với biển Hàm Ninh hơn 30 năm. Chỗ nghỉ này được thiết kế để bạn trải nghiệm cuộc sống ngư dân đích thực với hải sản tươi rói mỗi sớm mai.',
    price: 1980000,
    rating: 4.89,
    reviews: 265,
    specs: [
      '4 khách',
      '2 phòng ngủ',
      '2 giường King',
      'Bếp mở ven biển',
      'Chèo kayak miễn phí',
    ],
    sleepDesc: '2 giường King size hướng biển đón trọn bình minh sớm mai.',
    photos: [
      '/assets/client/hotel-coast.jpg',
      '/assets/client/phuquoc.jpg',
      '/assets/client/hotel-garden.jpg',
      '/assets/client/experience.jpg',
      '/assets/client/hotel-pine.jpg',
    ],
    desc: [
      'Nơi trú ẩn bình yên với mái lá dừa nước và sàn gỗ mộc kề sát mép nước làng chài Hàm Ninh.',
      'Sáng sớm đi bộ ra cầu cảng mua ghẹ Hàm Ninh tươi ngon, trưa chèo kayak trên mặt biển phẳng lặng như gương.',
    ],
    cleaningFee: 220000,
    serviceFee: 170000,
    discount: 120000,
  },
  'moc-garden': {
    id: 'moc-garden',
    title: 'Mộc Garden Retreat | Biệt thự vườn cây · Đà Nẵng',
    city: 'Đà Nẵng',
    location: 'Bán đảo Sơn Trà · giữa vườn cây cổ thụ',
    type: 'Toàn bộ villa sinh thái ẩn mình dưới tán rừng',
    hostName: 'Trọng Nghĩa',
    hostAvatar: '/assets/client/hoian.jpg',
    hostBio:
      'Mong muốn mang lại trải nghiệm tắm rừng (Shinrin-yoku) thanh lọc tâm trí ngay giữa thành phố biển Đà Nẵng.',
    price: 1650000,
    rating: 4.8,
    reviews: 198,
    specs: [
      '3 khách',
      '1 phòng ngủ',
      '1 giường King',
      'Bể bơi đá tự nhiên',
      'Vườn thiền trà',
    ],
    sleepDesc: '1 giường King cao cấp nhìn ra vườn cây cổ thụ râm mát.',
    photos: [
      '/assets/client/hotel-garden.jpg',
      '/assets/client/hotel-heritage.jpg',
      '/assets/client/hotel-coast.jpg',
      '/assets/client/experience.jpg',
      '/assets/client/hoian.jpg',
    ],
    desc: [
      'Nép mình dưới chân bán đảo Sơn Trà, Mộc Garden sở hữu khu vườn xanh mướt với những cây cổ thụ trăm tuổi và tiếng chim hót lảnh lót.',
      'Hồ bơi lát đá tự nhiên trong veo và góc thiền trà an tĩnh đem lại sự tái tạo năng lượng sâu sắc.',
    ],
    cleaningFee: 190000,
    serviceFee: 150000,
    discount: 95000,
  },
}

export const HOTEL_SWITCHER_CHIPS = [
  { id: 'the-lagom', label: 'The Lagom (Q1 · Chuẩn StayHub)' },
  { id: 'cloud-pine', label: 'Cloud Pine (Đà Lạt)' },
  { id: 'an-nhien', label: 'An Nhiên (Phú Quốc)' },
  { id: 'may-heritage', label: 'Mây Heritage (Đà Nẵng)' },
  { id: 'field-house', label: 'The Field House (Sa Pa)' },
  { id: 'lang-chai', label: 'Làng Chài (Phú Quốc)' },
  { id: 'moc-garden', label: 'Mộc Garden (Sơn Trà)' },
]
