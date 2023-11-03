var express = require("express");
var router = express.Router();
const pool = require("../db/db");

/**
 
(1) 고객의 주문 데이터를 관리하는 커피전문점이 있다. 

(2) 고객은 고객 이름으로 식별되고,주소와 휴대폰번호를 가진다.

(3) 하나의 주문은 주문 날짜와 계산을 한 고객으로 식별된다.

(4) 하나의 주문에는 현금,신용카드,수표 등의 지불방식을 기록해야 한다.각각의 주문은 하나 또는 그 이상의 메뉴항목으로 구성된다.

(5) 주문은 각각의 메뉴 항목 단위로 이루어지고,주문 수량도 기록된다.

(6) 메뉴항목은 항목번호로 식별되고,메뉴항목의 이름과 가격,그리고 커피,차,음료,제과,상품,세트메뉴,상품권,무선인터넷 같은 분류를 가진다.

(7) 하나의 메뉴항목을 준비하는 데는 양도 다르고 종류도 다른 재료가 한 가지 이상 필요하다.

(8) 재료들은 그 이름으로 식별되고,커피자바는 각각의 재료마다 킬로미터,리터,파운드 같은 주문 단위를 기록하며,양으로 재주문한다.

(9) 하나의 재료는 하나 또는 그 이상의 메뉴항목에서 사용될 수 있고,하나의 메뉴항목은 하나 또는 그 이상의 재료로 구성될 수 있다.

(10) 요리장은 특별 메뉴 항목에 사용되는 재료가 얼마나 되는지를 파악하고 있어야 한다. 

(11) CEO는 다양한 재료를 제공하는 공급업체 목록을 관리해야 한다.

(12) 공급업체들은 그들의 공급업체 번호로 식별되고,공급업체 이름과 주소를 가진다.

(13) 재료의 가격은 공급업체마다 다르며 공급업체의 납기도 음식재료마다 다르다.

 *
 */

/**
 * 발생한 문제
 * customer 테이블에 등록된 회원만 주문이 가능한 상태이다.
 * 회원가입 기능을 만들지 않았는데 어떻함..
 *
 */

// 해야할것
/**
 * 관리자용 페이지
 * 재료 | 재고량 | 업체 조회
 *
 * 회원용 페이지
 */

// 커피 메뉴 전체 페이지 (메인 페이지)
router.get("/", async (req, res, next) => {
  // const basket = req.session.basket;
  // console.log("!!!", basket);

  // req.session.basket = arr;
  // const basket2 = req.session.basket;
  // console.log("???", basket2);
  const basket = req.session.basket;
  console.log("basket:", basket);

  sess = "";

  // 커피 메뉴 전체 조회
  const coffee = await pool.query("select * from coffee.menu;");
  // console.log("!!!", coffee[0]);
  res.render("index", { title: "Express", sess: sess, coffee: coffee[0] });
});

// 커피/메뉴 상세페이지
router.get("/menuDetail/:menuNumber", async (req, res) => {
  // 임시 장바구니 조회
  const basket = req.session.basket;

  const { menuNumber } = req.params;
  // console.log("number:", menuNumber);
  try {
    // const coffeeDetail = await pool.query(
    //   "select * from coffee.menu where menuNumber = ?",
    //   [menuNumber]
    // );

    //
    const coffee = await pool.query(
      "select * from coffee.menu where menuNumber = ?;",
      [menuNumber]
    );
    // console.log("!!!!", coffee[0]);

    // 선택한 커피의 영양성분까지 조회 (menu_has_ingredient)
    // 영양성분 참조할 데이터가 없으면 해당 메뉴 데이터까지 조회가 안되는 버그가 있음
    const coffeeIngredient = await pool.query(
      "SELECT b.*, c.* FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber where a.menu_menuNumber = ?",
      [menuNumber]
    );

    // console.log("???", coffeeIngredient[0]);

    return res.render("coffeeDetail", {
      coffee: coffee[0],
      menuNumber: menuNumber,
    });
  } catch (error) {
    console.log(error);
  }
});

// 커피/메뉴 담기
router.post("/addItem/:menuNumber", async (req, res, next) => {
  const { count, menuNumber, menuPrice, menuName } = req.body;
  // console.log("!!!", count, menuNumber, menuPrice);

  /**
   * 임시 장바구니 쿠키로 만듬
   */
  let basket = [];
  basket.push({
    menuNumber: menuNumber,
    menuName: menuName,
    count: count,
    menuPrice: menuPrice,
  });

  // console.log("!!!", basket);
  // console.log("???", req.session.basket);
  // 중복된 물건 처리
  temp = req.session.basket;
  if (temp != undefined) {
    for (var i = 0; i < temp.length; i++) {
      if (temp[i].menuNumber === menuNumber) {
        basket[i].count = String(
          Number(basket[i].count) + Number(temp[i].count)
        );
        console.log("!!!", temp[i]);
      } else {
        basket.push(temp[i]);
      }
    }
  }

  req.session.basket = basket;
  /**
   * --
   */

  res.send(
    `<script type = "text/javascript" >alert("장바구니에 추가되었습니다"); location.href="/";</script>`
  );
});

// 장바구니 조회
router.get("/basket", async (req, res, next) => {
  const basket = req.session.basket;

  console.log("장바구니 내역:", basket);

  let totalMoney = 0;
  for (var i = 0; i < basket.length; i++) {
    totalMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
  }

  res.render("basket", { basket: basket, totalMoney: totalMoney });
});

// 주문요청
router.post("/order", async (req, res, next) => {
  const { totalMoney } = req.body;
  const basket = req.session.basket;
  // console.log(totalMoney, basket);

  // 날짜 생성
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let date = today.getDate();
  const wdate = year + "-" + month + "-" + date;

  res.render("order", {
    orderDate: wdate,
    totalMoney: totalMoney,
    basket: basket,
  });
});

// 주문진행
router.post("/ordering", async (req, res, next) => {
  const { orderType, orderDate, customerId } = req.body;
  const basket = req.session.basket;
  console.log("basket:", basket);
  // order 테이블에 주문번호 자동생성 (orderType, orderDate, customerId, orderId)

  const orderAdd = await pool.query(
    "insert into coffee.order values(?,?,?,null) ",
    [orderType, orderDate, Number(customerId)]
  );

  // order-menu (menuNumber, orderId, menuCount)
  const orderSel = await pool.query(
    "select * from coffee.order where orderType = ? and orderDate =? and customer_customerId = ?",
    [orderType, orderDate, Number(customerId)]
  );
  console.log("orderSel:", orderSel[0]);

  for (var i = 0; i < basket.length; i++) {
    const orderMenuAdd = await pool.query(
      "insert into coffee.order_menu values(?,?,?);",
      [Number(basket[i].menuNumber), orderSel[0][0].orderId, basket[i].count]
    );
  }
  res.send(
    `<script type = "text/javascript">alert("주문이 완료되었습니다."); location.href="/"</script>`
  );
});

// 주문 내역 조회
router.get("/orderList", async (req, res, next) => {
  const orderList = await pool.query(
    "SELECT b.*, c.* FROM coffee.order_menu a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.order c on a.order_orderId = c.orderId;"
  );
  console.log(orderList[0]);
  res.render("orderList", { data: orderList[0] });
});

// 재료 업체별 재고량 조회
router.get("/supply", async (req, res, next) => {
  const supplyList = await pool.query(
    "SELECT a.ingredientCount, b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on a.Supply_SupplyNumber = b.SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );
  console.log(supplyList[0]);

  res.render("supplyList", { supply: supplyList[0] });
});

module.exports = router;
