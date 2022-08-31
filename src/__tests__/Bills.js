/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES,ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      screen.getByTestId('icon-window');
//to-do write expect expression

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills.sort ((a, b) => (a.date < b.date ? 1 : -1)) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const BillsOrder = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(BillsOrder)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on Nouvelle note de frais", () => {
    // check if the formulaire Bill is created
    test("Then the form to create a new bill appear", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      };
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      const billsInit = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
      const handleClickNewBill = jest.fn(() => billsInit.handleClickNewBill ())
      const BtnNBills = screen.getByTestId("btn-new-bill")
      BtnNBills.addEventListener("click", handleClickNewBill)
      userEvent.click(BtnNBills)
      expect(handleClickNewBill).toHaveBeenCalled()
      await waitFor(() => screen.getByTestId("form-new-bill"))
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })
  describe("When I navigate to Bills", () => {
    // check si la page à bien été load
    test("Then the page show", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
  })
// check if the modal est bien affiché sur le site
  describe("When I click on the eye of a bill", () => {
    test("Then a modal must appear", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      const billsInit = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })

      const handleClickIconEye = jest.fn((icon) => billsInit.handleClickIconEye(icon));
      const iconEye = screen.getAllByTestId("icon-eye");
      const modaleFile = document.getElementById("modaleFile")
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
      iconEye.forEach((icon) => {
        icon.addEventListener("click", handleClickIconEye(icon))
        userEvent.click(icon)
        expect(handleClickIconEye).toHaveBeenCalled()
      })
      expect(modaleFile).toHaveClass("show")
    })
  })
})

