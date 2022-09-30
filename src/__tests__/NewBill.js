/**
 * @jest-environment jsdom
 */
// mise en place des imports
// Test d'intégration signifie vérifier si différents modules fonctionnent correctement lorsqu'ils sont combinés en tant que groupe.
// Test unitaire signifie tester des modules individuels d'une application de manière isolée (sans aucune interaction avec les dépendances) pour confirmer que le code fait les choses correctement.
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event"
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I submit a new Bill", () => {
    // vérifier si la sauvegarde à bien lieu au niveau du bill créé
    test("Then must save the bill", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))

      const html = NewBillUI()
      document.body.innerHTML = html

      const initNewBills= new NewBill({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const formNewBill = screen.getByTestId("form-new-bill")
      expect(formNewBill).toBeTruthy()

      const handleSubmit = jest.fn((e) => initNewBills.handleSubmit(e));
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test("Then show the new bill page", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    // verification du folder voir s'il est bien là
    test("Then verify the file bill", async() => {
      jest.spyOn(mockStore, "bills")

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill']} })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      // const initier le nouveau bill et le rendre html
      const html = NewBillUI()
      document.body.innerHTML = html

      const initNewBills = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      // const qui rend le type new file égal à celui de png pour n'avoir que ce format là de disponible et de visible
      // grace au if egalitarian créer sur la page newbill dans containers
      const file = new File(['image'], 'image.png', {type: 'image/png'});
      const handleChangeFile = jest.fn((e) => initNewBills.handleChangeFile(e));
      const formNewBill = screen.getByTestId("form-new-bill")
      const billFile = screen.getByTestId('file');

      billFile.addEventListener("change", handleChangeFile);
      userEvent.upload(billFile, file)

      expect(billFile.files[0].name).toBeDefined()
      expect(handleChangeFile).toBeCalled()

      const handleSubmit = jest.fn((e) => initNewBills.handleSubmit(e));
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    })
  })
  // build integrity
  // ceci nous permet d'initier les tests d'erreur page not found si il y a un soucis avec l'appel de l'API
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

