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
 * 레시피 새로짜기
 * 업체별 재료 새로짜기
 *
 */

// 커피 메뉴 전체 페이지
router.get("/", async (req, res, next) => {
  const order_menu = await pool.query(
    "SELECT a.*, b.* , c.*FROM coffee.order_menu a inner join coffee.order b on a.order_orderId = b.orderId inner join coffee.menu c on a.menu_menuNumber = c.menuNumber;"
  );
  const menu_ingredient = await pool.query(
    "SELECT a.*, b.*, c.* FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );
  const supply_ingredient = await pool.query(
    "SELECT a.* , b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on b.SupplyNumber = a.Supply_SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );
  // console.log("order_menu:",order_menu[0]);
  // console.log("menu_ingredient:",menu_ingredient[0]);
  // console.log("supply_ingredient:", supply_ingredient[0]);

  const basket = req.session.basket;

  res.render("index", {});
});

// 커피 물품 검색 기능
router.post("/coffee/search", async (req, res, next) => {
  // 키워드 입력
  let { key } = req.body;
  if (key == "coffee") {
    key = "커피";
  }
  try {
    const coffeeSearch = await pool.query(
      "select * from coffee.menu where menuName like ?  or menuCategory like ?",
      ["%" + key + "%", "%" + key + "%"]
    );
    if (coffeeSearch[0] == []) {
      return res.send(
        `<script type = "text/javascript">alert("해당 카테고리가 없습니다."); location.href= "/";</script>`
      );
    }
    return res.render("menuList", { coffee: coffeeSearch[0], starMenu: "1" });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript">alert("해당 카테고리가 없습니다."); location.href= "/";</script>`
    );
  }
});

// 커피 리스트/메뉴 리스트 페이지
router.get("/orderList", async (req, res, next) => {
  const coffee = await pool.query("select * from coffee.menu;");

  /**
   *
   */
  // 추천메뉴 대표메뉴
  temp = [];

  for (var i = 0; i < coffee[0].length; i++) {
    if (coffee[0][i].starMenu == "1") {
      temp.push({
        menuNumber: coffee[0][i].menuNumber,
        starMenu: "추천메뉴",
      });
    } else if (coffee[0][i].starMenu == "2") {
      temp.push({
        menuNumber: coffee[0][i].menuNumber,
        starMenu: "대표메뉴",
      });
    } else {
      temp.push({
        menuNumber: coffee[0][i].menuNumber,
        starMenu: "",
      });
    }
  }

  res.render("menuList", {
    coffee: coffee[0],
    starMenu: temp,
  });
});

router.post("/starmenu", async (req, res, next) => {
  const starMenu = await pool.query("select * from coffee.menu;");
  temp = [];
  for (var i = 0; i < starMenu[0].length; i++) {
    if (starMenu[0][i].starMenu != "2") {
      temp.push({
        menuNumber: starMenu[0][i].menuNumber,
        menuName: starMenu[0][i].menuName,
        starMenu: starMenu[0][i].starMenu,
      });
    }
  }
  res.render("manage", { starMenu: temp });
});

router.post("/starMenu/update", async (req, res, next) => {
  const { starMenu, menuNumber } = req.body;

  const menu = await pool.query("select * from coffee.menu;");

  let temp = [];
  for (var i = 0; i < starMenu.length; i++) {
    if (starMenu[i] == "추천메뉴") {
      temp.push({
        menuNumber: menuNumber[i],
        starMenu: "1",
      });
    } else if (starMenu[i] == "") {
      temp.push({
        menuNumber: menuNumber[i],
        starMenu: "0",
      });
    } else {
      return res.send(
        `<script type = "text/javascript">alert("다시 작성해주세요."); window.history.back();</script>`
      );
    }
  }

  try {
    for (var j = 0; j < starMenu.length; j++) {
      const starMenuUpdate = await pool.query(
        "update coffee.menu set starMenu = ? where menuNumber = ?",
        [temp[j].starMenu, Number(temp[j].menuNumber)]
      );
    }
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript">location.href = "/";</script>`
    );
  }
  return res.send(
    `<script type = "text/javascript">alert("재고량 체크중"); location.href = "/tests";</script>`
  );
});

//  추천메뉴는 재고 30개 이상 유지 시켜야함
router.get("/tests", async (req, res, next) => {
  const menu_ingredient = await pool.query(
    "SELECT a.*, b.*, c.* FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );
  const menu = await pool.query("select * from coffee.menu;");

  let temp = [];

  for (var i = 0; i < menu_ingredient[0].length; i++) {
    let newCount = Number(menu_ingredient[0][i].ingredientSize) * 30;
    for (var j = 0; j < menu[0].length; j++) {
      if (
        menu_ingredient[0][i].menuNumber == menu[0][j].menuNumber &&
        menu[0][j].starMenu == "1"
      )
        temp.push({
          ingredientNumber: menu_ingredient[0][i].ingredientNumber,
          count: newCount,
        });
    }
  }

  for (var i = 0; i < temp.length; i++) {
    const menuUpdate = await pool.query(
      "update coffee.ingredient set count = ? where ingredientNumber = ?",
      [temp[i].count, Number(temp[i].ingredientNumber)]
    );
  }

  return res.send(
    `<script type = "text/javascript">alert("방금 재고를 채웠어요."); location.href= "/";</script>`
  );
});

/**
 * ---- 과거
 */

// 커피 상세페이지
router.get("/menuDetail/:menuNumber", async (req, res) => {
  // 임시 장바구니 조회
  const basket = req.session.basket;

  const { menuNumber } = req.params;

  try {
    // 해당 커피 조회
    const coffee = await pool.query(
      "select * from coffee.menu where menuNumber = ?;",
      [menuNumber]
    );

    // 커피 재료 조회
    const coffeeIngredient = await pool.query(
      "SELECT b.*, c.*, a.ingredientSize FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber where a.menu_menuNumber = ?",
      [menuNumber]
    );

    return res.render("coffeeDetail", {
      coffee: coffee[0],
      menuNumber: menuNumber,
      ingredient: coffeeIngredient[0],
    });
  } catch (error) {
    console.log(error);
  }
});

// 장바구니 페이지
router.get("/basket", async (req, res, next) => {
  const basket = req.session.basket;
  try {
    if (basket == undefined) {
      return res.send(
        `<script type = "text/javascript">alert("장바구니에 물품이 없습니다."); window.history.back();</script>`
      );
    }
    return res.render("basket", { basket: basket });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript">alert("장바구니에 물품이 없습니다."); window.history.back();</script>`
    );
  }
});

// 장바구니 담기
router.post("/addItem/:menuNumber", async (req, res, next) => {
  const { count, menuNumber, menuPrice, menuName } = req.body;

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

  // 중복된 물건 처리 로직
  temp = req.session.basket;
  if (temp != undefined) {
    for (var i = 0; i < temp.length; i++) {
      if (temp[i].menuNumber === menuNumber) {
        basket[i].count = String(
          Number(basket[i].count) + Number(temp[i].count)
        );
      } else {
        basket.push(temp[i]);
      }
    }
  }

  req.session.basket = basket;
  /**
   *
   */
  res.send(
    `<script type = "text/javascript" >alert("장바구니에 추가되었습니다"); location.href = "/orderList";</script>`
  );
});

// 주문서 페이지
router.post("/order", async (req, res, next) => {
  // 선택 요소
  const { check } = req.body;
  const basket = req.session.basket;

  // 날짜 생성
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let date = today.getDate();
  const wdate = year + "-" + month + "-" + date;

  // 총액 새로 계산
  let resultMoney = 0;
  let disMoney = 0;
  const total = await pool.query("select * from coffee.customer;");

  // 총액 계산
  try {
    for (var i = 0; i < basket.length; i++) {
      resultMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
    }
  } catch (error) {
    console.log(error);
  }
  if (total[0][0].grade == "골드") {
    disMoney = resultMoney * 0.2;
  } else if (total[0][0].grade == "실버") {
    disMoney = resultMoney * 0.1;
  } else if (total[0][0].grade == "브론즈") {
    disMoney = resultMoney * 0.05;
  }
  req.session.disMoney = disMoney;
  res.render("order", {
    orderDate: wdate,
    resultMoney: resultMoney,
    basket: basket,
    check: check,
    disMoney: disMoney,
  });
});

// 주문하기 기능
router.post("/ordering", async (req, res, next) => {
  const { orderType, orderDate, customerId, check } = req.body;
  let disMoney = req.session.disMoney;
  try {
    let basket = req.session.basket;
    console.log(basket);

    const order_menu = await pool.query(
      "SELECT a.*, b.* , c.*FROM coffee.order_menu a inner join coffee.order b on a.order_orderId = b.orderId inner join coffee.menu c on a.menu_menuNumber = c.menuNumber;"
    );
    const menu_ingredient = await pool.query(
      "SELECT a.*, b.*, c.* FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
    );
    const supply_ingredient = await pool.query(
      "SELECT a.* , b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on b.SupplyNumber = a.Supply_SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
    );

    // console.log("order_menu:", order_menu[0]);
    // console.log("menu_ingredient:", menu_ingredient[0]);
    // console.log("supply_ingredient:", supply_ingredient[0]);

    // user 조회
    const users = await pool.query(
      "select * from coffee.customer where customerId = ?",
      [Number(customerId)]
    );

    if (users[0][0] == undefined) {
      return res.send(
        `<script type = "text/javascript">alert("주문 중 문제가 발생했습니다. 주문서를 다시 확인해주세요."); window.history.back();</script>`
      );
    }
    let resultMoney = 0;
    for (var i = 0; i < basket.length; i++) {
      resultMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
    }

    const orderAdd = await pool.query(
      "insert into coffee.order values(?,?,null,?,?,?,?)",
      [
        orderType,
        orderDate,
        Number(customerId),
        users[0][0].customerName,
        Number(resultMoney),
        Number(disMoney),
      ]
    );

    const orderSel = await pool.query(
      "select * from coffee.order where orderType = ? and orderDate =? and customer_customerId = ? order by orderId desc;",
      [orderType, orderDate, Number(customerId)]
    );

    // 선택한 메뉴들만 주문
    for (var i = 0; i < basket.length; i++) {
      // if (check[i] == basket[i].menuNumber) {
      // 주문한 메뉴 주문하기
      console.log("basket:", basket);

      const orderMenuAdd = await pool.query(
        "insert into coffee.order_menu values(null, ?,?,?);",
        [
          Number(basket[i].menuNumber),
          Number(orderSel[0][0].orderId),
          Number(basket[i].count),
        ]
      );
      let totalMoney = 0;
      for (var i = 0; i < basket.length; i++) {
        totalMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
      }

      //누적액 추가
      const totalSel = await pool.query("select * from coffee.customer");

      const orderMenu = await pool.query(
        "update coffee.customer set total = ? where customerId = 1234",
        [totalMoney + Number(totalSel[0][0].total)]
      );

      // 주문 후 장바구니 비우기
      req.session.basket = undefined;

      /**
       *
       *
       */

      const total = await pool.query("select * from coffee.customer;");
      console.log(total[0]);

      // for (var i = 0; i < total[0].length; i++) {
      if (total[0][0].total >= 50000) {
        const update = await pool.query(
          "update coffee.customer set grade = ?",
          ["골드"]
        );
      } else if (total[0][0].total >= 30000) {
        const update = await pool.query(
          "update coffee.customer set grade = ?",
          ["실버"]
        );
      } else {
        const update = await pool.query(
          "update coffee.customer set grade = ?",
          ["브론즈"]
        );
      }
      // }
      /**
       *
       *
       */

      // 주문 완료 신호
      return res.send(
        `<script type = "text/javascript">alert("주문이 완료되었습니다."); location.href="/"</script>`
      );
    }
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript">alert("주문 중 문제가 발생했습니다. 주문서를 다시 확인해주세요."; window.history.back();</script>`
    );
  }
});

// 바로구매 페이지
// router.post("/purchase", async (req, res) => {
//   const { count, menuName, menuNumber, menuPrice } = req.body;

//   try {

//     let basket = [
//       {
//         menuNumber: menuNumber,
//         menuName: menuName,
//         count: count,
//         menuPrice: menuPrice,
//       },
//     ];

//     req.session.basket = basket;
//     // 날짜 생성
//     let today = new Date();
//     let year = today.getFullYear();
//     let month = today.getMonth();
//     let date = today.getDate();
//     const totalMoney = Number(basket[0].count) * Number(basket[0].menuPrice);

//     const wdate = year + "-" + month + "-" + date;

//     return res.render("order", {
//       basket: basket,
//       orderDate: wdate,
//       totalMoney: totalMoney,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

// 주문 내역 조회
router.get("/orderList", async (req, res, next) => {
  const orderList = await pool.query(
    "SELECT b.*, c.* FROM coffee.order_menu a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.order c on a.order_orderId = c.orderId;"
  );
  res.render("orderList", { data: orderList[0] });
});

// 주문내역 검색
router.get("/orderSearch", async (req, res, next) => {
  res.render("orderSelect");
});

// 주문내역 검색 조회
router.post("/orderSearch/Result", async (req, res, next) => {
  const { customerId } = req.body;

  try {
    const orderList = await pool.query(
      "SELECT a.menuCount, b.*, c.* FROM coffee.order_menu a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.order c on a.order_orderId = c.orderId where customer_customerId = ? order by orderId ;",
      [Number(customerId)]
    );

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

// 재료 업체별 재고량 페이지
router.get("/supplySearch", async (req, res, next) => {
  const supplyList = await pool.query(
    "SELECT a.*, b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on a.Supply_SupplyNumber = b.SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );

  res.render("supplySearch");
});

// 재료 업체별 재고량 조회 기능
router.post("/supplySearch", async (req, res) => {
  const { customerId } = req.body;
  try {
    const customerCheck = await pool.query(
      "select * from coffee.customer where customerId = ? ",
      [customerId]
    );
    // if (customerCheck[0].length != 0) {
    if (customerCheck[0][0].customerId == 1987) {
      const supplyList = await pool.query(
        "SELECT a.*, b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on a.Supply_SupplyNumber = b.SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
      );
      return res.render("supplyList", { supply: supplyList[0] });
    } else {
      return res.send(
        `<script type = "text/javascript" >alert('해당 관리자가 존재하지 않습니다'); location.href = "/supplySearch"; </script>`
      );
    }
    // }
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript" >alert('해당 관리자가 존재하지 않습니다'); location.href = "/supplySearch"; </script>`
    );
  }
});

// 커피 메뉴 추가 페이지
router.get("/menuAdd", async (req, res, next) => {
  res.render("menuAdd");
});

// 커피 메뉴 추가 기능
router.post("/manage/menuAdd", async (req, res, next) => {
  const { menuName, menuPrice, menuKind } = req.body;
  try {
    const menuAdd = await pool.query(
      "insert into coffee.menu values(null, ?,?,?)",
      [menuName, menuPrice, menuKind]
    );
    return res.send(
      `<script type = "text/javascript">alert("메뉴가 추가되었습니다."); location.href = "/";</script>`
    );
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript">alert("메뉴가 추가실패."); location.href = "/";</script>`
    );
  }
});

// 업체별 재료 추가 페이지
router.get("/ingredientAdd", async (req, res, next) => {
  const supply = await pool.query("select * from coffee.Supply;");
  res.render("ingredientAdd", { company: supply[0] });
});

// 업체별 재료 추가 기능
router.post("/ingredientAdd", async (req, res, next) => {
  const { company, ingredientName, count, ingredientPrice } = req.body;
  const supply = await pool.query(
    "select SupplyNumber from coffee.Supply where Supplyname = ?",
    [company]
  );

  const menu = await pool.query(
    "select ingredientNumber from coffee.ingredient where ingredientName = ?",
    [ingredientName]
  );

  try {
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
  } catch (error) {
    console.log(error);
    res.send(
      `<script type = "text/javascript">alert("해당 재료가 없습니다."); window.history.back();</script>`
    );
  }
});

// 레시피 추가 페이지
router.get("/recipe", async (req, res, next) => {
  const coffee = await pool.query("select * from coffee.menu;");

  res.render("recipeList", { coffee: coffee[0] });
});

// (아이템 디테일)
router.get("/recipeDetail/:menuNumber", async (req, res, next) => {
  const { menuNumber } = req.params;

  try {
    const coffee = await pool.query(
      "select * from coffee.menu where menuNumber = ?",
      [menuNumber]
    );

    const coffeeIngredient = await pool.query(
      "SELECT b.*, c.*, a.ingredientSize FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber where a.menu_menuNumber = ?",
      [menuNumber]
    );

    return res.render("recipeDetail", {
      coffee: coffee[0],
      menuNumber: menuNumber,
      ingredient: coffeeIngredient[0],
    });
  } catch (error) {
    console.log(error);
  }
});

// 레시피 조회 페이지
router.post("/recipe/addPage", async (req, res, next) => {
  const { menuNumber } = req.body;
  const menu = await pool.query(
    "select menuName from coffee.menu where menuNumber = ?",
    [menuNumber]
  );
  res.render("recipeAdd", {
    menuNumber: menuNumber,
    menuName: menu[0][0].menuName,
  });
});

//레시피 추가 기능
router.post("/recipe/add", async (req, res, next) => {
  const { menuNumber, ingredientName, ingredientSize } = req.body;
  try {
    const ingredient = await pool.query(
      "select ingredientNumber from coffee.ingredient where ingredientName = ?",
      [ingredientName]
    );

    const recipeAdd = await pool.query(
      "insert into coffee.menu_has_ingredient values(?,?,?)",
      [
        Number(menuNumber),
        Number(ingredient[0][0].ingredientNumber),
        ingredientSize,
      ]
    );
    res.send(
      `<script type = "text/javascript">alert("재료가 추가되었습니다."); location.href = "/recipe";</script>`
    );
  } catch (error) {
    console.log(error);
    res.send(
      `<script type = "text/javascript">alert("재료를 다시 확인해주세요."); window.history.back();</script>`
    );
  }
});

// 레시피 수정 기능
router.post("/recipe/update", async (req, res, next) => {
  const { menuNumber, ingredientNumber, name, size } = req.body;
  try {
    for (var i = 0; i < menuNumber.length; i++) {
      const recipeUpdate = await pool.query(
        "update coffee.menu_has_ingredient set ingredientSize = ? where menu_menuNumber = ? and ingredient_ingredientNumber = ? ",
        [size[i], Number(menuNumber[i]), Number(ingredientNumber[i])]
      );
    }
    res.send(
      `<script type = "text/javascript">alert("레시피가 업데이트 되었습니다."); location.href = "/recipe";</script>`
    );
  } catch (error) {
    console.log(error);
    res.send(
      `<script type = "text/javascript">alert("업데이트 오류가 발생하였습니다."); location.href = "/recipe";</script>`
    );
  }
});

//레시피 삭제 기능
router.post("/recipe/del/:target", async (req, res, next) => {
  const { ingredientNumber, menuNumber } = req.body;
  try {
    const delIngredient = await pool.query(
      "delete from menu_has_ingredient where ingredient_ingredientNumber = ? and menu_menuNumber = ?",
      [Number(ingredientNumber), Number(menuNumber)]
    );
    return res.send(
      `<script type = "text/javascript">alert("재료를 삭제하였습니다"); window.history.back(); location.reload();</script>`
    );
  } catch (error) {
    console.log(error);
  }
});

// 베스트메뉴 1, 2 뽑기
router.get("/best", async (req, res, next) => {
  const menu = await pool.query("select menuName from menu;");
  // console.log(menu[0]);

  const data = await pool.query(
    "SELECT a.*, b.* , c.*FROM coffee.order_menu a inner join coffee.order b on a.order_orderId = b.orderId inner join coffee.menu c on a.menu_menuNumber = c.menuNumber;"
  );
  // console.log(data[0]);
  temp = [];
  for (var i = 0; i < menu[0].length; i++) {
    const menudata = await pool.query(
      "SELECT sum(menuCount) count, c.menuName FROM coffee.order_menu a inner join coffee.order b on a.order_orderId = b.orderId inner join coffee.menu c on a.menu_menuNumber = c.menuNumber where menuName = ? ;",
      [menu[0][i].menuName]
    );
    console.log(menudata[0]);
    temp.push({
      menuName: menudata[0][0].menuName,
      count: Number(menudata[0][0].count),
    });
  }
  temp.sort(function (a, b) {
    return b.count - a.count;
  });

  console.log("!!!", temp);
  res.render("bestMenu", { temp });
});
router.get("/table", async (req, res) => {
  const data2 = await pool.query("select * from coffee.month;");

  res.render("table", { data: data2[0] });
});

// 2주차 s.. ( 검사는 안맡음)
router.post("/table", async (req, res) => {
  const data = [
    {
      year: "2023-11",
      rank: "1",
      menuName: "아메리카노",
      count: "100",
    },
    {
      year: "2023-11",
      rank: "2",
      menuName: "블루베리 스무디",
      count: "50",
    },
  ];
  for (var i = 0; i < data.length; i++) {
    const data = await pool.query(
      "insert into coffee.month values(null, ?,?,?,?)",
      [data.year, data.rank, data.menuName, data.count]
    );
  }

  // console.log(temp);

  // console.log(order[0]);
  // for (var i = 0; i < order[0].length; i++) {
  //   const insertMon = await pool.query(
  //     "insert into coffee.month values(null,?,?,?,?)",
  //     [order[0][i].orderDate]
  //   );
  // }
  res.render("table", {});
});

// 구매 총액 누적 B
router.get("/total", async (req, res) => {});

// 등급 올라가는거 A

// 등급에 따라서 할인금액 S

module.exports = router;
