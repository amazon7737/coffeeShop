var express = require("express");
var router = express.Router();
const pool = require("../db/db");

/**
 * 발생한 문제
 * customer 테이블에 등록된 회원만 주문이 가능한 상태이다.
 * 회원가입 기능을 만들지 않았는데 어떻함..
 *
 */

// 해야할것
/**
 *
 * 메뉴에 사용되는 재료 항목 추가
 */

/**
 * 길
 *
 *
 * /basket 장바구니
 *
 * /order 주문내역 조회
 * /supply 재고량 조회 및 재료 구매 기능
 *
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

  // 커피 메뉴 전체 조회
  const coffee = await pool.query("select * from coffee.menu;");
  // console.log("!!!", coffee[0]);
  res.render("index", {
    title: "Express",
    coffee: coffee[0],
  });
});

router.get("/manage", async (req, res, next) => {
  res.render("manage");
});

// 커피 리스트/메뉴 담으러가기
router.get("/orderList", async (req, res, next) => {
  const coffee = await pool.query("select * from coffee.menu;");
  // console.log("!!!", coffee[0]);
  res.render("menuList", {
    coffee: coffee[0],
  });
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
    `<script type = "text/javascript" >alert("장바구니에 추가되었습니다"); location.href="/manage";</script>`
  );
});

// 장바구니 이지
router.get("/basket", async (req, res, next) => {
  const basket = req.session.basket;
  console.log("장바구니 내역:", basket);
  let totalMoney = 0;
  try {
    for (var i = 0; i < basket.length; i++) {
      totalMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
    }
    return res.render("basket", { basket: basket, totalMoney: totalMoney });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript">alert("장바구니에 물품이 없습니다."); location.href="/manage";</script>`
    );
  }
});

// 주문서 페이지
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

// 주문하기 기능
router.post("/ordering", async (req, res, next) => {
  const { orderType, orderDate, customerId } = req.body;
  const basket = req.session.basket;
  console.log("basket:", basket);
  // order 테이블에 주문번호 자동생성 (orderType, orderDate, customerId, orderId)
  const users = await pool.query(
    "select * from coffee.customer where customerId = ?",
    [Number(customerId)]
  );
  console.log("users:", users[0][0]);

  const orderAdd = await pool.query(
    "insert into coffee.order values(?,?,null, ?,?) ",
    [orderType, orderDate, Number(customerId), users[0][0].customerName]
  );

  // order-menu (menuNumber, orderId, menuCount)
  const orderSel = await pool.query(
    "select * from coffee.order where orderType = ? and orderDate =? and customer_customerId = ?",
    [orderType, orderDate, Number(customerId)]
  );
  console.log("orderSel:", orderSel[0]);

  for (var i = 0; i < basket.length; i++) {
    const orderMenuAdd = await pool.query(
      "insert into coffee.order_menu values(null, ?,?,?);",
      [
        Number(basket[i].menuNumber),
        Number(orderSel[0][0].orderId),
        basket[i].count,
      ]
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

// 주문내역 검색
router.get("/orderSearch", async (req, res, next) => {
  res.render("orderSelect");
});

// 주문내역 검색 조회
router.post("/orderSearch/Result", async (req, res, next) => {
  const { customerId } = req.body;

  // console.log("customerId:", customerId);
  try {
    const orderList = await pool.query(
      "SELECT b.*, c.* FROM coffee.order_menu a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.order c on a.order_orderId = c.orderId where customer_customerId = ? order by orderId ;",
      [Number(customerId)]
    );

    // console.log("orderList:", orderList[0][0].orderId);

    if (orderList[0][0].orderId === undefined) {
      return res.send(
        `<script type = "text/javascript" >alert("해당 회원의 주문 내역이 없습니다."); location.href="/orderSearch";</script>`
      );
    }
    return res.render("orderList", { data: orderList[0] });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript" >alert("해당 회원의 주문 내역이 없습니다."); location.href="/orderSearch";</script>`
    );
  }
});

// 재료 업체별 재고량 조회
router.get("/supplyList", async (req, res, next) => {
  const supplyList = await pool.query(
    "SELECT a.*, b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on a.Supply_SupplyNumber = b.SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );
  console.log(supplyList[0]);

  res.render("supplyList", { supply: supplyList[0] });
});

// 커피 메뉴 추가 페이지
router.get("/menuAdd", async (req, res, next) => {
  res.render("menuAdd");
});

// 커피 메뉴 추가 기능
router.post("/manage/menuAdd", async (req, res, next) => {
  const { menuName, menuPrice, menuKind } = req.body;
  console.log(menuName, menuPrice, menuKind);
  try {
    const menuAdd = await pool.query(
      "insert into coffee.menu values(null, ?,?,?)",
      [menuName, menuPrice, menuKind]
    );
    console.log(menuAdd);
    return res.send(
      `<script type = "text/javascript">alert("메뉴가 추가되었습니다."); location.href = "/manage";</script>`
    );
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript">alert("메뉴가 추가실패."); location.href = "/manage";</script>`
    );
  }
});

// 재료 추가 페이지
router.get("/ingredientAdd", async (req, res, next) => {
  const supply = await pool.query("select * from coffee.Supply");
  console.log("supply:", supply[0]);
  res.render("ingredientAdd", { company: supply[0] });
});

// 재료 추가 기능
router.post("/ingredientAdd", async (req, res, next) => {
  const { company, ingredientName, count, ingredientPrice } = req.body;
  console.log(company, ingredientName, ingredientPrice, count);
  const supply = await pool.query(
    "select SupplyNumber from coffee.Supply where Supplyname = ?",
    [company]
  );
  console.log("supply:", supply[0]);

  const menu = await pool.query(
    "select ingredientNumber from coffee.ingredient where ingredientName = ?",
    [ingredientName]
  );
  console.log("menu:", menu[0]);

  const ingredient_supply = await pool.query(
    "insert into coffee.Supply_has_ingredient values(?,?,?,?)",
    [
      Number(supply[0][0].SupplyNumber),
      Number(menu[0][0].ingredientNumber),
      count,
      ingredientPrice,
    ]
  );
  res.send(
    `<script type = "text/javascript" >alert("재료를 추가하였습니다"); location.href="/";</script>`
  );
});

// 메뉴-재료 추가 페이지
router.get("/menuMake", async (req, res, next) => {
  res.render("menuMake");
});

// 메뉴-재료 추가 기능

module.exports = router;
