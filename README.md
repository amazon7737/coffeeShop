# coffeeShop

> 커피 전문점

베스트 메뉴
1
2
를 뽑는데

많이 팔린 메뉴를 얘기

주문-메뉴에 수량 , menuid 그룹핑해보면 제일 많이 팔린거 알수 있곘지여

select count(\*) from coffee.order_menu where menu_menu_id = ?

for 문으로 돌리자

(A , B)

- S

월별 테이블 만들어서 2023년 11월에 1등 제품은 무엇 ..
데이터를 넣어..
월별로 베스트 1, 2 만 뽑아서 저장

월이 어딧는가 order에 orderDate
