-- Local development seed (npm run db:reset). Never run against production.
-- Every demo account signs in with the password: around-demo-2026
begin;

create temporary table demo_people (
  n int primary key,
  id uuid not null,
  email text not null,
  username text not null,
  display_name text not null,
  bio text not null,
  joined interval not null
) on commit drop;

insert into demo_people values
  (1, '0b6a3c2e-1d1e-4c44-9a10-000000000001', 'harin@around.test',  'harin',      '김하린', '그림 그리는 사람. 동네 산책하다 발견한 것들을 기록해요.', interval '40 days'),
  (2, '0b6a3c2e-1d1e-4c44-9a10-000000000002', 'doyun@around.test',  'doyun_park', '박도윤', '백엔드 개발자. 장애 없는 금요일을 꿈꿉니다.', interval '38 days'),
  (3, '0b6a3c2e-1d1e-4c44-9a10-000000000003', 'seoyeon@around.test','seoyeon',    '이서연', '망원동 작은 책방 「오후 세시」를 운영합니다.', interval '35 days'),
  (4, '0b6a3c2e-1d1e-4c44-9a10-000000000004', 'minjun@around.test', 'minjun',     '정민준', '아침마다 한강을 달려요. 이번 가을 목표는 하프 마라톤.', interval '30 days'),
  (5, '0b6a3c2e-1d1e-4c44-9a10-000000000005', 'yuna@around.test',   'yuna_c',     '최유나', '연남동 카페에서 커피를 내립니다. 원두 이야기라면 언제든.', interval '21 days'),
  (6, '0b6a3c2e-1d1e-4c44-9a10-000000000006', 'jiho@around.test',   'jiho',       '한지호', '필름 카메라로 골목을 찍어요.', interval '14 days'),
  (7, '0b6a3c2e-1d1e-4c44-9a10-000000000007', 'serin@around.test',  'serin',      '오세린', 'UX 리서치 대학원생. 사람들이 왜 그렇게 쓰는지 궁금해요.', interval '9 days'),
  (8, '0b6a3c2e-1d1e-4c44-9a10-000000000008', 'taeo@around.test',   'taeo',       '윤태오', '작곡가. 일상 소리를 샘플링해서 곡을 만듭니다.', interval '3 days');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('around-demo-2026', extensions.gen_salt('bf')), now() - joined,
  '{"provider":"email","providers":["email"]}', '{}', now() - joined, now() - joined,
  '', '', '', ''
from demo_people;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), id, id::text,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now() - joined, now() - joined, now() - joined
from demo_people;

insert into public.profiles (id, username, display_name, bio, created_at)
select id, username, display_name, bio, now() - joined from demo_people;

create temporary table demo_posts (
  key text primary key,
  author int not null,
  content text not null,
  age interval not null,
  id uuid not null default gen_random_uuid()
) on commit drop;

insert into demo_posts (key, author, content, age) values
  ('p01', 1, '오늘의 발견: 골목 끝 철물점 간판이 손글씨였다는 것.', interval '26 days'),
  ('p02', 3, E'이번 주 책방 추천은 「작은 것들의 신」입니다.\n오래 걸려도 끝까지 읽게 되는 책이 있어요. 금요일 저녁 낭독회도 열어요. 자리가 여섯 개뿐이라 미리 말해 주세요.', interval '20 days'),
  ('p03', 2, '배포는 금요일 오후에 하지 않는다. 이 규칙 하나로 지킨 주말이 몇 번인지.', interval '15 days'),
  ('p04', 4, E'새벽 5시 40분 반포대교.\n10km를 52분에 끊었어요. 작년 이맘때보다 4분 빨라졌습니다.', interval '11 days'),
  ('p05', 5, '에티오피아 구지 내추럴이 들어왔어요. 복숭아 향이 확 올라옵니다.', interval '8 days'),
  ('p06', 6, E'을지로 3가, 해 질 무렵 20분.\n필름 한 롤을 다 썼는데 마음에 드는 건 두 장. 그래도 그 두 장 때문에 계속 찍게 돼요.', interval '6 days'),
  ('p07', 7, E'인터뷰하다 보면 사람들이 "불편하지 않아요"라고 말하면서 같은 버튼을 세 번 누르는 장면을 자주 봐요.\n말보다 손이 정직하다는 걸 매번 배웁니다.', interval '4 days'),
  ('p08', 8, '지하철 문 닫히는 소리를 녹음해서 킥 드럼으로 썼다.', interval '2 days 3 hours'),
  ('p09', 1, '가을 첫 니트를 꺼냈다.', interval '1 day 6 hours'),
  ('p10', 2, E'오늘 장애 회고에서 나온 말.\n"원인은 하나가 아니었고, 그래서 다행이었다." 한 군데만 막혔으면 훨씬 오래 헤맸을 거예요.', interval '20 hours'),
  ('p11', 5, '비 오는 날엔 라떼 주문이 두 배가 된다. 이유는 아무도 모름.', interval '7 hours'),
  ('p12', 3, '책방 고양이 보리가 오늘 처음으로 손님 무릎에 올라갔어요.', interval '3 hours'),
  ('p13', 4, '하프 마라톤 신청 완료. 이제 물러설 곳이 없다.', interval '50 minutes');

insert into public.posts (id, author_id, content, created_at)
select p.id, d.id, p.content, now() - p.age
from demo_posts p join demo_people d on d.n = p.author;

create temporary table demo_comments (
  key text primary key,
  post text not null,
  parent text,
  author int not null,
  content text not null,
  age interval not null,
  id uuid not null default gen_random_uuid()
) on commit drop;

insert into demo_comments (key, post, parent, author, content, age) values
  ('c01', 'p02', null, 7, '낭독회 자리 하나 부탁드려도 될까요?', interval '19 days'),
  ('c02', 'p02', 'c01', 3, '@serin 네, 이름 적어둘게요. 금요일 7시예요.', interval '19 days' - interval '2 hours'),
  ('c03', 'p02', 'c01', 7, '@seoyeon 감사합니다! 친구 한 명도 데려가도 될까요?', interval '19 days' - interval '3 hours'),
  ('c04', 'p02', 'c01', 3, '@serin 그럼 두 자리로 바꿔둘게요.', interval '19 days' - interval '4 hours'),
  ('c05', 'p03', null, 7, '금요일 배포 금지는 거의 업계 표준 아닌가요.', interval '14 days'),
  ('c06', 'p03', 'c05', 2, '@serin 표준인데 다들 한 번씩은 어겨 봐야 체감하더라고요.', interval '14 days' - interval '1 hour'),
  ('c07', 'p04', null, 5, '대단해요. 저는 5km도 숨이 차던데.', interval '10 days'),
  ('c08', 'p04', 'c07', 4, '@yuna_c 처음엔 저도 3km에서 멈췄어요. 천천히 늘리면 돼요.', interval '10 days' - interval '3 hours'),
  ('c09', 'p04', null, 6, '반포대교 새벽 사진 찍으러 가고 싶었는데, 같이 가도 돼요?', interval '9 days'),
  ('c10', 'p05', null, 1, '복숭아 향이라니. 내일 들를게요.', interval '7 days'),
  ('c11', 'p05', 'c10', 5, '@harin 핸드드립으로 드릴게요.', interval '7 days' - interval '1 hour'),
  ('c12', 'p06', null, 8, '두 장이면 충분히 성공한 롤이죠.', interval '5 days'),
  ('c13', 'p06', null, 3, '책방 벽에 걸고 싶은 사진이에요. 전시 해볼 생각 있어요?', interval '5 days' - interval '2 hours'),
  ('c14', 'p06', 'c13', 6, '@seoyeon 정말요? 작게라도 해보고 싶어요.', interval '5 days' - interval '5 hours'),
  ('c15', 'p06', 'c13', 3, '@jiho 다음 달 첫 주 비어 있어요. 이야기 나눠봐요.', interval '4 days' - interval '20 hours'),
  ('c16', 'p07', null, 2, '로그 보면 정확히 그렇게 나와요. 더블클릭, 트리플클릭.', interval '3 days'),
  ('c17', 'p07', 'c16', 7, '@doyun_park 로그랑 인터뷰를 같이 보면 진짜 재밌어요.', interval '3 days' - interval '2 hours'),
  ('c18', 'p08', null, 6, '그 소리 진짜 박자감 있죠. 듣고 싶어요.', interval '2 days'),
  ('c19', 'p08', 'c18', 8, '@jiho 완성되면 제일 먼저 올릴게요.', interval '1 day 20 hours'),
  ('c20', 'p10', null, 4, '원인이 여러 개라 다행이었다는 말이 묘하게 위로가 되네요.', interval '18 hours'),
  ('c21', 'p11', null, 1, '비 오는 날엔 따뜻한 게 손에 있어야 해서 아닐까요.', interval '6 hours'),
  ('c22', 'p11', 'c21', 5, '@harin 그 가설 채택합니다.', interval '5 hours'),
  ('c23', 'p12', null, 7, '보리 사진 올려 주세요.', interval '2 hours'),
  ('c24', 'p12', null, 1, '보리 그려도 될까요?', interval '1 hour'),
  ('c25', 'p12', 'c24', 3, '@harin 보리가 좋아할 거예요.', interval '30 minutes');

insert into public.comments (id, post_id, parent_id, author_id, content, created_at)
select c.id, p.id, parent.id, d.id, c.content, now() - c.age
from demo_comments c
join demo_posts p on p.key = c.post
join demo_people d on d.n = c.author
left join demo_comments parent on parent.key = c.parent
order by c.parent nulls first, c.age desc;

insert into public.follows (follower_id, followee_id, created_at)
select a.id, b.id, now() - interval '1 day' * ((a.n * 7 + b.n * 3) % 20)
from demo_people a
join demo_people b on a.n <> b.n
where (a.n, b.n) in (
  (1,3),(1,5),(1,6),(1,8),
  (2,7),(2,4),(2,1),
  (3,1),(3,6),(3,7),(3,5),
  (4,2),(4,5),(4,6),
  (5,1),(5,3),(5,4),
  (6,3),(6,8),(6,1),(6,4),
  (7,3),(7,2),(7,1),
  (8,6),(8,1)
);

commit;
