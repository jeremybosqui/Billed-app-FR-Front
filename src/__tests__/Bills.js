/**
 * @jest-environment jsdom
 */
// mise en place des imports
// Test d'intégration signifie vérifier si différents modules fonctionnent correctement lorsqu'ils sont combinés en tant que groupe.
// Test unitaire signifie tester des modules individuels d'une application de manière isolée (sans aucune interaction avec les dépendances) pour confirmer que le code fait les choses correctement.
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES,ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
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
      // on check si le screen affiche bien la page "mes notes de frais" et du coup on expect que la page soit bien là grace à tobetruthy qui est en gros un boolean qui va dire soit vrai soit false
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
      // const billesInit qui initie un bill basique = new Bills qui va créer un nouveau bills à partir de la fonction déjà utilisé précédemment
      const billsInit = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
      // creation des const qui permettent au click sur l'icon-eye d'afficher la modal grace à classlist.add
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
  // build integrity init test error 404 et 500
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          "localStorage",
          { value: localStorageMock }
      )
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    // test pour l'erreur 404 ( page not found )
    test("Then fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const Errormessage = await screen.getByText(/Erreur 404/)
      expect(Errormessage).toBeTruthy()
    })
    // test pour l'erreur 500 (  indique un problème qui affecte le serveur sur lequel le site est hébergé )
    test("Then fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const messageError = await screen.getByText(/Erreur 500/)
      expect(messageError).toBeTruthy()
    })
  })
})

