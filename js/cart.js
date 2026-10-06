(() => {
    'use strict';

    // =========================================================
    // CATÁLOGO
    // =========================================================
    // El catálogo se construye una sola vez a partir de todas las tarjetas.
    // Si un producto aparece en Home y en una categoría, el ID lo identifica
    // como el mismo producto y los datos canónicos se mantienen en products.
    const products = new Map();
    const cart = new Map();
    const productCards = [...document.querySelectorAll('.product-card, .category-product-card')];
    const homeProductCards = productCards.filter((card) => card.classList.contains('product-card'));
    const allProductCards = productCards;

    const categoryNames = {
        bebidas: 'Bebidas',
        almacen: 'Almacén',
        snacks: 'Snacks',
        lacteos: 'Lácteos',
        limpieza: 'Limpieza y Perfumería',
    };

    const getCategoryViewName = (card) => {
        const view = card.closest('.category-view');
        if (!view) return '';

        const viewName = view.id.replace(/View$/, '');
        return categoryNames[viewName] || '';
    };

    const getCardProductName = (card) => {
        const heading = card.classList.contains('product-card')
            ? card.querySelector('h3')
            : card.querySelector('h4');
        return heading?.textContent.trim() || '';
    };

    const getCardImageClass = (card) => {
        const imageElement = card.querySelector('.product-image, .category-product-visual');
        return [...(imageElement?.classList || [])]
            .find((className) => className.startsWith('product-')) || 'product-red';
    };

    const getCardMainCategory = (card) => {
        if (card.classList.contains('product-card')) {
            return card.querySelector('.product-category')?.textContent.trim() || 'Producto';
        }

        return getCategoryViewName(card) || card.dataset.category || 'Producto';
    };

    const getCardSubcategory = (card) => {
        if (card.classList.contains('product-card')) return '';
        return card.dataset.category || card.querySelector('.category-product-body small')?.textContent.trim() || '';
    };

    const registerProductCard = (card) => {
        const id = card.dataset.productId;
        const price = Number(card.dataset.price);
        const name = getCardProductName(card);

        if (!id || !name || !Number.isFinite(price)) return;

        const candidate = {
            id,
            name: name.replace(/\s*[×x]\s*1\s*$/, '').trim(),
            price,
            category: getCardMainCategory(card),
            subcategory: getCardSubcategory(card),
            imageClass: getCardImageClass(card),
            offer: Boolean(card.querySelector('.offer-tag')),
            available: card.dataset.outOfStock !== 'true',
        };

        const existing = products.get(id);

        // Home es la referencia principal para los datos generales del producto,
        // pero la categoría aporta la subcategoría cuando esa información solo
        // existe en la vista de categoría. Así el catálogo conserva ambos datos.
        if (!existing) {
            products.set(id, candidate);
            return;
        }

        if (card.classList.contains('product-card')) {
            products.set(id, {
                ...existing,
                ...candidate,
                subcategory: candidate.subcategory || existing.subcategory || ''
            });
            return;
        }

        if (!existing.subcategory && candidate.subcategory) {
            products.set(id, { ...existing, subcategory: candidate.subcategory });
        }
    };

    productCards.forEach(registerProductCard);

    // Normalizamos el estado visual de todas las tarjetas contra el catálogo
    // central. Esto evita que una copia de categoría tenga un precio o stock
    // diferente del producto real.
    productCards.forEach((card) => {
        const product = products.get(card.dataset.productId);
        if (!product) return;

        card.dataset.price = String(product.price);

        if (product.available) {
            delete card.dataset.outOfStock;
        } else {
            card.dataset.outOfStock = 'true';
        }

        const addButton = card.querySelector('.add-button');
        if (addButton) {
            addButton.disabled = !product.available;
            addButton.classList.toggle('disabled', !product.available);
            addButton.setAttribute('aria-label', product.available
                ? `Agregar ${product.name}`
                : `${product.name} sin stock`
            );
        }
    });

    // =========================================================
    // ELEMENTOS DEL CARRITO
    // =========================================================
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartItemCount = document.getElementById('cartItemCount');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearCartButton = document.getElementById('clearCartButton');
    const closeCartButton = document.getElementById('closeCart');
    const cartButton = document.querySelector('.cart-button');
    const headerCartCount = cartButton?.querySelector('b');
    const headerCartText = cartButton?.querySelector('small');

    const pendingOrderButton = document.getElementById('pendingOrderButton');
    const pendingOrderBadge = document.getElementById('pendingOrderBadge');
    const pendingOrderDrawerButton = document.getElementById('pendingOrderDrawerButton');
    const pendingOrderDrawerNumber = document.getElementById('pendingOrderDrawerNumber');

    const pendingOrderBackdrop = document.getElementById('pendingOrderBackdrop');
    const pendingOrderModal = document.getElementById('pendingOrderModal');
    const pendingOrderClose = document.getElementById('pendingOrderClose');
    const pendingOrderModalNumber = document.getElementById('pendingOrderModalNumber');
    const pendingOrderDate = document.getElementById('pendingOrderDate');
    const pendingOrderCustomer = document.getElementById('pendingOrderCustomer');
    const pendingOrderPhone = document.getElementById('pendingOrderPhone');
    const pendingOrderAddress = document.getElementById('pendingOrderAddress');
    const pendingOrderBetween = document.getElementById('pendingOrderBetween');
    const pendingOrderPayment = document.getElementById('pendingOrderPayment');
    const pendingOrderNotesRow = document.getElementById('pendingOrderNotesRow');
    const pendingOrderNotes = document.getElementById('pendingOrderNotes');
    const pendingOrderItemCount = document.getElementById('pendingOrderItemCount');
    const pendingOrderItems = document.getElementById('pendingOrderItems');
    const pendingOrderTotal = document.getElementById('pendingOrderTotal');
    const pendingOrderEditButton = document.getElementById('pendingOrderEditButton');
    const pendingOrderCancelButton = document.getElementById('pendingOrderCancelButton');

    const orderUpdateBackdrop = document.getElementById('orderUpdateBackdrop');
    const orderUpdateModal = document.getElementById('orderUpdateModal');
    const orderUpdateClose = document.getElementById('orderUpdateClose');
    const orderUpdateBackButton = document.getElementById('orderUpdateBackButton');
    const orderUpdateConfirmButton = document.getElementById('orderUpdateConfirmButton');
    const orderUpdateNumber = document.getElementById('orderUpdateNumber');
    const orderUpdateItemCount = document.getElementById('orderUpdateItemCount');
    const orderUpdateTotal = document.getElementById('orderUpdateTotal');

    const newOrderConfirmationBackdrop = document.getElementById('newOrderConfirmationBackdrop');
    const newOrderConfirmationModal = document.getElementById('newOrderConfirmationModal');
    const newOrderConfirmationClose = document.getElementById('newOrderConfirmationClose');
    const newOrderConfirmationBackButton = document.getElementById('newOrderConfirmationBackButton');
    const newOrderConfirmationContinueButton = document.getElementById('newOrderConfirmationContinueButton');

    const PENDING_ORDER_STORAGE_KEY = 'autoservicioTomatePendingOrder';

    if (!drawer || !overlay || !cartItems || !cartTotal || !cartItemCount) {
        console.error('No se pudo inicializar el carrito: faltan elementos del DOM.');
        return;
    }

    const money = (value) => `$ ${Number(value).toLocaleString('es-AR')}`;

    const totalUnits = () =>
        [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);

    const totalPrice = () =>
        [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);

    const openCart = () => {
        drawer.classList.add('is-open');
        overlay.hidden = false;
        requestAnimationFrame(() => overlay.classList.add('is-visible'));
        drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cart-open');
    };

    const closeCart = () => {
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-visible');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-open');
        window.setTimeout(() => {
            if (!drawer.classList.contains('is-open')) overlay.hidden = true;
        }, 220);
    };

    const getPendingOrder = () => {
        try {
            const raw = window.localStorage.getItem(PENDING_ORDER_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('No se pudo leer el pedido pendiente.', error);
            return null;
        }
    };

    const savePendingOrder = (order) => {
        try {
            window.localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(order));
        } catch (error) {
            console.warn('No se pudo guardar el pedido pendiente.', error);
        }
    };

    const formatPendingOrderDate = (timestamp) => {
        if (!timestamp) return 'Pedido realizado recientemente';

        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return 'Pedido realizado recientemente';

        return `Realizado el ${date.toLocaleDateString('es-AR')} a las ${date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    };

    const updatePendingOrderIndicator = () => {
        const order = getPendingOrder();
        const hasPendingOrder = Boolean(order?.number);

        if (pendingOrderButton) pendingOrderButton.hidden = !hasPendingOrder;
        if (pendingOrderBadge) pendingOrderBadge.textContent = hasPendingOrder ? '1' : '';
        if (pendingOrderDrawerButton) pendingOrderDrawerButton.hidden = !hasPendingOrder;
        if (pendingOrderDrawerNumber) pendingOrderDrawerNumber.textContent = order?.number || '#00000000';
    };

    const updateHeader = () => {
        const units = totalUnits();

        if (headerCartCount) headerCartCount.textContent = units;
        if (headerCartText) {
            headerCartText.textContent = `${units} ${units === 1 ? 'producto' : 'productos'}`;
        }

        cartItemCount.textContent = `${units} ${units === 1 ? 'producto' : 'productos'}`;
        cartTotal.textContent = money(totalPrice());

        if (checkoutButton) {
            checkoutButton.disabled = units === 0;
            checkoutButton.textContent = editingPendingOrder
                ? 'Actualizar pedido'
                : 'Continuar con el pedido';
        }

        if (clearCartButton) clearCartButton.disabled = units === 0;

        const cartHint = checkoutButton?.parentElement?.querySelector(':scope > small');
        if (cartHint) {
            cartHint.textContent = editingPendingOrder
                ? 'Tus datos y método de pago se mantienen al actualizar.'
                : 'El método de pago se elegirá al confirmar el pedido.';
        }

        updatePendingOrderIndicator();
    };

    const renderCart = () => {
        if (cart.size === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <strong>Tu pedido está vacío</strong>
                    <span>Agregá productos con el botón + y aparecerán acá.</span>
                </div>`;
            updateHeader();
            return;
        }

        cartItems.innerHTML = [...cart.values()].map((item) => `
            <article class="cart-item" data-cart-id="${item.id}">
                <div class="cart-item-thumb ${item.imageClass}">
                    <span>●</span>
                </div>
                <div class="cart-item-content">
                    <div class="cart-item-top">
                        <div>
                            <span class="cart-item-category">${item.category}</span>
                            <strong>${item.name}</strong>
                        </div>
                        <button type="button" class="cart-remove" data-action="remove" aria-label="Quitar ${item.name}">×</button>
                    </div>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">${money(item.price * item.quantity)}</span>
                        <div class="quantity-control" aria-label="Cantidad de ${item.name}">
                            <button type="button" data-action="decrease" aria-label="Reducir cantidad">−</button>
                            <span>${item.quantity}</span>
                            <button type="button" data-action="increase" aria-label="Aumentar cantidad">+</button>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');

        updateHeader();
    };

    const addProduct = (id) => {
        const product = products.get(id);

        if (!product) {
            console.warn(`Producto no encontrado: ${id}`);
            return;
        }

        if (!product.available) return;

        const current = cart.get(id);
        cart.set(id, {
            ...product,
            quantity: current ? current.quantity + 1 : 1
        });

        renderCart();
        openCart();
    };

    const changeQuantity = (id, delta) => {
        const current = cart.get(id);
        if (!current) return;

        const nextQuantity = current.quantity + delta;

        if (nextQuantity <= 0) {
            cart.delete(id);
        } else {
            cart.set(id, { ...current, quantity: nextQuantity });
        }

        renderCart();
    };

    const removeProduct = (id) => {
        cart.delete(id);
        renderCart();
    };

    // Event delegation: funciona tanto con productos Home como de categorías.
    document.addEventListener('click', (event) => {
        const addButton = event.target.closest('.add-button');
        if (addButton && !addButton.disabled) {
            const card = addButton.closest('.product-card, .category-product-card');
            const id = card?.dataset.productId;
            if (id) addProduct(id);
            return;
        }

        const cartAction = event.target.closest('button[data-action]');
        if (cartAction && cartItems.contains(cartAction)) {
            const item = cartAction.closest('[data-cart-id]');
            if (!item) return;

            const id = item.dataset.cartId;
            const action = cartAction.dataset.action;

            if (action === 'increase') changeQuantity(id, 1);
            if (action === 'decrease') changeQuantity(id, -1);
            if (action === 'remove') removeProduct(id);
        }
    });

    cartButton?.addEventListener('click', openCart);
    closeCartButton?.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    clearCartButton?.addEventListener('click', () => {
        cart.clear();
        renderCart();
    });

    // =========================================================
    // MI CUENTA — perfil temporal de la sesión
    // =========================================================
    const accountButton = document.getElementById('accountButton');
    const accountStatus = document.getElementById('accountStatus');
    const accountModal = document.getElementById('accountModal');
    const accountBackdrop = document.getElementById('accountBackdrop');
    const accountClose = document.getElementById('accountClose');
    const accountCancelButton = document.getElementById('accountCancelButton');
    const accountClearButton = document.getElementById('accountClearButton');
    const accountForm = document.getElementById('accountForm');
    const accountError = document.getElementById('accountError');
    const profileFields = {
        name: document.getElementById('profileName'),
        phone: document.getElementById('profilePhone'),
        street: document.getElementById('profileStreet'),
        number: document.getElementById('profileNumber'),
        between: document.getElementById('profileBetween')
    };
    const PROFILE_STORAGE_KEY = 'autoservicioTomateProfile';

    const getSavedProfile = () => {
        try {
            const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('No se pudo leer el perfil de la sesión.', error);
            return null;
        }
    };

    const saveProfile = (profile) => {
        try {
            window.sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.warn('No se pudo guardar el perfil de la sesión.', error);
            return false;
        }
    };

    const clearSavedProfile = () => {
        try {
            window.sessionStorage.removeItem(PROFILE_STORAGE_KEY);
        } catch (error) {
            console.warn('No se pudo eliminar el perfil de la sesión.', error);
        }
    };

    const hasCompleteProfile = (profile) => Boolean(
        profile?.name?.trim()
        && profile?.phone?.trim()
        && profile?.street?.trim()
        && profile?.number?.trim()
        && profile?.between?.trim()
    );

    const updateAccountIndicator = () => {
        const profile = getSavedProfile();
        const hasProfile = hasCompleteProfile(profile);
        if (accountStatus) {
            accountStatus.textContent = 'Ingresar';
            accountStatus.hidden = hasProfile;
        }
        if (accountButton) {
            accountButton.classList.toggle('has-profile', hasProfile);
            accountButton.setAttribute('aria-label', hasProfile ? 'Editar mis datos' : 'Abrir mi cuenta');
        }
    };

    const loadProfileIntoAccountForm = () => {
        const profile = getSavedProfile() || {};
        Object.entries(profileFields).forEach(([key, field]) => {
            if (field) field.value = profile[key] || '';
        });
        if (accountError) accountError.textContent = '';
    };

    const clearAccountForm = () => {
        Object.values(profileFields).forEach((field) => {
            if (field) field.value = '';
        });
        if (accountError) accountError.textContent = '';
    };

    const openAccount = () => {
        if (!accountModal || !accountBackdrop) return;

        loadProfileIntoAccountForm();
        accountModal.hidden = false;
        accountBackdrop.hidden = false;
        requestAnimationFrame(() => {
            accountBackdrop.classList.add('is-visible');
            accountModal.classList.add('is-open');
        });
        accountModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('account-open');
        profileFields.name?.focus();
    };

    const closeAccount = () => {
        if (!accountModal || !accountBackdrop) return;

        accountModal.classList.remove('is-open');
        accountBackdrop.classList.remove('is-visible');
        accountModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('account-open');
        window.setTimeout(() => {
            if (!accountModal.classList.contains('is-open')) {
                accountModal.hidden = true;
                accountBackdrop.hidden = true;
            }
        }, 220);
    };

    const getProfileFromAccountForm = () => ({
        name: profileFields.name?.value.trim() || '',
        phone: profileFields.phone?.value.trim() || '',
        street: profileFields.street?.value.trim() || '',
        number: profileFields.number?.value.trim() || '',
        between: profileFields.between?.value.trim() || ''
    });

    const applyProfileToCheckout = (profile) => {
        if (!hasCompleteProfile(profile)) return;
        checkoutFields.name.value = profile.name;
        checkoutFields.phone.value = profile.phone;
        checkoutFields.street.value = profile.street;
        checkoutFields.number.value = profile.number;
        checkoutFields.between.value = profile.between;
    };

    const saveProfileFromCheckout = () => {
        const profile = {
            name: checkoutFields.name?.value.trim() || '',
            phone: checkoutFields.phone?.value.trim() || '',
            street: checkoutFields.street?.value.trim() || '',
            number: checkoutFields.number?.value.trim() || '',
            between: checkoutFields.between?.value.trim() || ''
        };

        if (hasCompleteProfile(profile)) {
            saveProfile(profile);
            updateAccountIndicator();
        }
    };

    accountButton?.addEventListener('click', openAccount);
    accountClose?.addEventListener('click', closeAccount);
    accountCancelButton?.addEventListener('click', closeAccount);
    accountBackdrop?.addEventListener('click', closeAccount);

    accountClearButton?.addEventListener('click', () => {
        clearSavedProfile();
        clearAccountForm();
        updateAccountIndicator();
    });

    accountForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const profile = getProfileFromAccountForm();

        if (!hasCompleteProfile(profile)) {
            if (accountError) accountError.textContent = 'Completá nombre, teléfono, calle, altura y entre calles.';
            return;
        }

        if (!saveProfile(profile)) {
            if (accountError) accountError.textContent = 'No se pudieron guardar los datos en esta sesión.';
            return;
        }

        updateAccountIndicator();
        closeAccount();
    });

    // =========================================================
    // CHECKOUT MODAL
    // =========================================================
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutBackdrop = document.getElementById('checkoutBackdrop');
    const checkoutClose = document.getElementById('checkoutClose');
    const backToOrderButton = document.getElementById('backToOrderButton');
    const checkoutForm = document.getElementById('checkoutForm');
    const finishCheckoutButton = document.getElementById('finishCheckoutButton');
    const confirmOrderButton = document.getElementById('confirmOrderButton');
    const checkoutSteps = [...document.querySelectorAll('[data-checkout-step]')];
    const progressSteps = [...document.querySelectorAll('[data-checkout-progress]')];
    let checkoutStep = 1;
    let editingPendingOrder = false;

    const checkoutFields = {
        name: document.getElementById('checkoutName'),
        phone: document.getElementById('checkoutPhone'),
        street: document.getElementById('checkoutStreet'),
        number: document.getElementById('checkoutNumber'),
        between: document.getElementById('checkoutBetween'),
        notes: document.getElementById('checkoutNotes'),
    };

    const getPaymentMethod = () =>
        document.querySelector('input[name="payment"]:checked')?.value || '';

    const setCheckoutStep = (step) => {
        checkoutStep = step;

        checkoutSteps.forEach((element) => {
            const isActive = Number(element.dataset.checkoutStep) === step;
            element.hidden = !isActive;
            element.classList.toggle('is-active', isActive);
        });

        progressSteps.forEach((element) => {
            const number = Number(element.dataset.checkoutProgress);
            element.classList.toggle('active', number === step);
            element.classList.toggle('completed', number < step);
        });

        const title = document.getElementById('checkoutTitle');
        const titles = {
            1: 'Completá tus datos',
            2: 'Método de pago',
            3: 'Revisar pedido',
            4: 'Pedido enviado',
        };
        if (title) title.textContent = titles[step] || 'Finalizar pedido';

        checkoutModal?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openCheckout = () => {
        if (cart.size === 0 || !checkoutModal || !checkoutBackdrop) return;

        checkoutForm?.reset();
        applyProfileToCheckout(getSavedProfile());
        document.querySelectorAll('input[name="payment"]').forEach((radio) => {
            radio.checked = false;
        });
        clearCheckoutErrors();

        editingPendingOrder = false;
        closeCart();
        setCheckoutStep(1);
        checkoutModal.hidden = false;
        checkoutBackdrop.hidden = false;
        requestAnimationFrame(() => {
            checkoutBackdrop.classList.add('is-visible');
            checkoutModal.classList.add('is-open');
        });
        checkoutModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('checkout-open');
        checkoutFields.name?.focus();
    };

    const closeCheckout = () => {
        if (!checkoutModal || !checkoutBackdrop) return;

        checkoutModal.classList.remove('is-open');
        checkoutBackdrop.classList.remove('is-visible');
        checkoutModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('checkout-open');
        window.setTimeout(() => {
            if (!checkoutModal.classList.contains('is-open')) {
                checkoutModal.hidden = true;
                checkoutBackdrop.hidden = true;
            }
        }, 220);
    };

    const clearCheckoutErrors = () => {
        document.querySelectorAll('.checkout-field.has-error').forEach((field) => {
            field.classList.remove('has-error');
        });
        document.querySelectorAll('.checkout-error[data-error-for]').forEach((error) => {
            error.textContent = '';
        });
        const paymentError = document.getElementById('checkoutPaymentError');
        if (paymentError) paymentError.textContent = '';
    };

    const validateDeliveryData = () => {
        clearCheckoutErrors();
        const requiredFields = [
            ['name', 'Ingresá tu nombre y apellido.'],
            ['phone', 'Ingresá un teléfono o WhatsApp.'],
            ['street', 'Ingresá la calle.'],
            ['number', 'Ingresá la altura.'],
            ['between', 'Ingresá entre qué calles queda la dirección.'],
        ];

        let valid = true;
        requiredFields.forEach(([key, message]) => {
            const field = checkoutFields[key];
            if (!field?.value.trim()) {
                valid = false;
                field?.closest('.checkout-field')?.classList.add('has-error');
                document.querySelector(`[data-error-for="${field?.id}"]`)?.replaceChildren(document.createTextNode(message));
            }
        });

        return valid;
    };

    const validatePayment = () => {
        const paymentError = document.getElementById('checkoutPaymentError');
        if (paymentError) paymentError.textContent = '';

        if (getPaymentMethod()) return true;
        if (paymentError) paymentError.textContent = 'Seleccioná un método de pago para continuar.';
        return false;
    };

    const renderCheckoutReview = () => {
        const payment = getPaymentMethod();
        const name = checkoutFields.name?.value.trim() || '';
        const phone = checkoutFields.phone?.value.trim() || '';
        const street = checkoutFields.street?.value.trim() || '';
        const number = checkoutFields.number?.value.trim() || '';
        const between = checkoutFields.between?.value.trim() || '';
        const notes = checkoutFields.notes?.value.trim() || '';

        document.getElementById('reviewCustomer').textContent = name;
        document.getElementById('reviewPhone').textContent = phone;
        document.getElementById('reviewAddress').textContent = `${street} ${number}`;
        document.getElementById('reviewBetween').textContent = `Entre ${between}`;
        document.getElementById('reviewNotes').textContent = notes ? `Nota: ${notes}` : '';
        document.getElementById('reviewPayment').textContent = payment;

        const reviewItems = document.getElementById('reviewItems');
        if (reviewItems) {
            reviewItems.innerHTML = [...cart.values()].map((item) => `
                <div class="checkout-review-item">
                    <strong>${item.name}</strong>
                    <small>x${item.quantity}</small>
                    <span>${money(item.price * item.quantity)}</span>
                </div>
            `).join('');
        }

        const units = totalUnits();
        const reviewItemCount = document.getElementById('reviewItemCount');
        if (reviewItemCount) reviewItemCount.textContent = `${units} ${units === 1 ? 'producto' : 'productos'}`;

        const reviewTotal = document.getElementById('reviewTotal');
        if (reviewTotal) reviewTotal.textContent = money(totalPrice());
    };

    const createOrderNumber = () => {
        const time = Date.now().toString().slice(-6);
        const suffix = Math.floor(Math.random() * 90 + 10);
        return `#${time}${suffix}`;
    };

    const buildPendingOrder = () => {
        const customer = {
            name: checkoutFields.name?.value.trim() || '',
            phone: checkoutFields.phone?.value.trim() || '',
            street: checkoutFields.street?.value.trim() || '',
            number: checkoutFields.number?.value.trim() || '',
            between: checkoutFields.between?.value.trim() || '',
            notes: checkoutFields.notes?.value.trim() || ''
        };

        return {
            number: createOrderNumber(),
            status: 'PENDIENTE',
            createdAt: new Date().toISOString(),
            customer,
            payment: getPaymentMethod(),
            items: [...cart.values()].map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category
            })),
            units: totalUnits(),
            total: totalPrice()
        };
    };

    const restorePendingOrderToCart = (order) => {
        cart.clear();

        const items = Array.isArray(order?.items) ? order.items : [];
        items.forEach((item) => {
            const product = products.get(item.id);
            const quantity = Math.max(1, Number(item.quantity) || 1);
            if (product && product.available) {
                cart.set(item.id, { ...product, quantity });
                return;
            }

            // Fallbacka para un producto que ya no esté en el catálogo actual.
            cart.set(item.id, {
                id: item.id,
                name: item.name || 'Producto',
                price: Number(item.price) || 0,
                category: item.category || 'Producto',
                subcategory: '',
                imageClass: 'product-red',
                available: true,
                quantity
            });
        });
    };

    const loadPendingOrderIntoCheckout = (order) => {
        const customer = order?.customer || {};

        checkoutFields.name.value = customer.name || '';
        checkoutFields.phone.value = customer.phone || '';
        checkoutFields.street.value = customer.street || '';
        checkoutFields.number.value = customer.number || '';
        checkoutFields.between.value = customer.between || '';
        checkoutFields.notes.value = customer.notes || '';

        document.querySelectorAll('input[name="payment"]').forEach((radio) => {
            radio.checked = radio.value === order?.payment;
        });

        clearCheckoutErrors();
    };

    const renderPendingOrder = (order) => {
        if (!order) return;

        const customer = order.customer || {};
        const items = Array.isArray(order.items) ? order.items : [];

        if (pendingOrderModalNumber) pendingOrderModalNumber.textContent = order.number || '#00000000';
        if (pendingOrderDate) pendingOrderDate.textContent = formatPendingOrderDate(order.createdAt);
        if (pendingOrderCustomer) pendingOrderCustomer.textContent = customer.name || '—';
        if (pendingOrderPhone) pendingOrderPhone.textContent = customer.phone || '—';
        if (pendingOrderAddress) pendingOrderAddress.textContent = `${customer.street || ''} ${customer.number || ''}`.trim() || '—';
        if (pendingOrderBetween) pendingOrderBetween.textContent = customer.between ? `Entre ${customer.between}` : '—';
        if (pendingOrderPayment) pendingOrderPayment.textContent = order.payment || '—';

        if (pendingOrderNotesRow && pendingOrderNotes) {
            const hasNotes = Boolean(customer.notes);
            pendingOrderNotesRow.hidden = !hasNotes;
            pendingOrderNotes.textContent = customer.notes || '';
        }

        if (pendingOrderItemCount) {
            const units = Number(order.units) || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            pendingOrderItemCount.textContent = `${units} ${units === 1 ? 'producto' : 'productos'}`;
        }

        if (pendingOrderItems) {
            pendingOrderItems.innerHTML = items.map((item) => `
                <div class="pending-order-item">
                    <div>
                        <strong>${item.name}</strong>
                        <small>x${item.quantity}</small>
                    </div>
                    <span>${money(Number(item.price) * Number(item.quantity))}</span>
                </div>
            `).join('');
        }

        if (pendingOrderTotal) pendingOrderTotal.textContent = money(order.total || 0);
    };

    const openPendingOrder = () => {
        const order = getPendingOrder();
        if (!order || !pendingOrderModal || !pendingOrderBackdrop) return;

        renderPendingOrder(order);
        pendingOrderModal.hidden = false;
        pendingOrderBackdrop.hidden = false;

        requestAnimationFrame(() => {
            pendingOrderBackdrop.classList.add('is-visible');
            pendingOrderModal.classList.add('is-open');
        });

        pendingOrderModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('pending-order-open');
    };

    const closePendingOrder = () => {
        if (!pendingOrderModal || !pendingOrderBackdrop) return;

        pendingOrderModal.classList.remove('is-open');
        pendingOrderBackdrop.classList.remove('is-visible');
        pendingOrderModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('pending-order-open');

        window.setTimeout(() => {
            if (!pendingOrderModal.classList.contains('is-open')) {
                pendingOrderModal.hidden = true;
                pendingOrderBackdrop.hidden = true;
            }
        }, 220);
    };

    const openOrderUpdateConfirmation = () => {
        const order = getPendingOrder();
        if (!editingPendingOrder || !order || cart.size === 0 || !orderUpdateModal || !orderUpdateBackdrop) return;

        const units = totalUnits();
        if (orderUpdateNumber) orderUpdateNumber.textContent = order.number || '#00000000';
        if (orderUpdateItemCount) orderUpdateItemCount.textContent = `${units} ${units === 1 ? 'producto' : 'productos'}`;
        if (orderUpdateTotal) orderUpdateTotal.textContent = money(totalPrice());

        closeCart();
        orderUpdateModal.hidden = false;
        orderUpdateBackdrop.hidden = false;

        requestAnimationFrame(() => {
            orderUpdateBackdrop.classList.add('is-visible');
            orderUpdateModal.classList.add('is-open');
        });

        orderUpdateModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('order-update-open');
    };

    const closeOrderUpdateConfirmation = () => {
        if (!orderUpdateModal || !orderUpdateBackdrop) return;

        orderUpdateModal.classList.remove('is-open');
        orderUpdateBackdrop.classList.remove('is-visible');
        orderUpdateModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('order-update-open');

        window.setTimeout(() => {
            if (!orderUpdateModal.classList.contains('is-open')) {
                orderUpdateModal.hidden = true;
                orderUpdateBackdrop.hidden = true;
            }
        }, 220);
    };

    const openNewOrderConfirmation = () => {
        if (!getPendingOrder()?.number || cart.size === 0 || !newOrderConfirmationModal || !newOrderConfirmationBackdrop) return;

        newOrderConfirmationModal.hidden = false;
        newOrderConfirmationBackdrop.hidden = false;

        requestAnimationFrame(() => {
            newOrderConfirmationBackdrop.classList.add('is-visible');
            newOrderConfirmationModal.classList.add('is-open');
        });

        newOrderConfirmationModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('new-order-confirmation-open');
        newOrderConfirmationBackButton?.focus();
    };

    const closeNewOrderConfirmation = () => {
        if (!newOrderConfirmationModal || !newOrderConfirmationBackdrop) return;

        newOrderConfirmationModal.classList.remove('is-open');
        newOrderConfirmationBackdrop.classList.remove('is-visible');
        newOrderConfirmationModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('new-order-confirmation-open');

        window.setTimeout(() => {
            if (!newOrderConfirmationModal.classList.contains('is-open')) {
                newOrderConfirmationModal.hidden = true;
                newOrderConfirmationBackdrop.hidden = true;
            }
        }, 220);
    };

    const updatePendingOrder = () => {
        const existingPendingOrder = getPendingOrder();
        if (!editingPendingOrder || !existingPendingOrder || cart.size === 0) return;

        const updatedOrder = {
            ...existingPendingOrder,
            status: 'PENDIENTE',
            updatedAt: new Date().toISOString(),
            items: [...cart.values()].map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                category: item.category
            })),
            units: totalUnits(),
            total: totalPrice()
        };

        savePendingOrder(updatedOrder);
        editingPendingOrder = false;
        cart.clear();
        renderCart();
        closeOrderUpdateConfirmation();

        window.setTimeout(() => {
            renderPendingOrder(updatedOrder);
            openPendingOrder();
        }, 240);
    };

    const modifyPendingOrder = () => {
        const order = getPendingOrder();
        if (!order) return;

        restorePendingOrderToCart(order);
        editingPendingOrder = true;
        renderCart();
        closePendingOrder();
        window.setTimeout(openCart, 240);
    };

    const cancelPendingOrder = () => {
        const order = getPendingOrder();
        if (!order) return;

        const confirmed = window.confirm(`¿Querés cancelar el pedido ${order.number || ''}?\n\nEsta acción eliminará el pedido pendiente de este dispositivo.`);
        if (!confirmed) return;

        try {
            window.localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
        } catch (error) {
            console.warn('No se pudo eliminar el pedido pendiente.', error);
        }

        editingPendingOrder = false;
        updatePendingOrderIndicator();
        closePendingOrder();
    };

    checkoutButton?.addEventListener('click', () => {
        if (editingPendingOrder) {
            openOrderUpdateConfirmation();
            return;
        }

        if (getPendingOrder()?.number) {
            openNewOrderConfirmation();
            return;
        }

        openCheckout();
    });
    checkoutClose?.addEventListener('click', closeCheckout);
    checkoutBackdrop?.addEventListener('click', closeCheckout);
    pendingOrderButton?.addEventListener('click', openPendingOrder);
    pendingOrderDrawerButton?.addEventListener('click', openPendingOrder);
    pendingOrderClose?.addEventListener('click', closePendingOrder);
    pendingOrderBackdrop?.addEventListener('click', closePendingOrder);
    pendingOrderEditButton?.addEventListener('click', modifyPendingOrder);
    pendingOrderCancelButton?.addEventListener('click', cancelPendingOrder);
    orderUpdateClose?.addEventListener('click', closeOrderUpdateConfirmation);
    orderUpdateBackdrop?.addEventListener('click', closeOrderUpdateConfirmation);
    orderUpdateBackButton?.addEventListener('click', () => {
        closeOrderUpdateConfirmation();
        window.setTimeout(openCart, 240);
    });
    orderUpdateConfirmButton?.addEventListener('click', updatePendingOrder);
    newOrderConfirmationClose?.addEventListener('click', closeNewOrderConfirmation);
    newOrderConfirmationBackButton?.addEventListener('click', closeNewOrderConfirmation);
    newOrderConfirmationBackdrop?.addEventListener('click', closeNewOrderConfirmation);
    newOrderConfirmationContinueButton?.addEventListener('click', () => {
        closeNewOrderConfirmation();
        window.setTimeout(openCheckout, 240);
    });
    backToOrderButton?.addEventListener('click', () => {
        closeCheckout();
        window.setTimeout(openCart, 240);
    });

    document.querySelectorAll('[data-checkout-next]').forEach((button) => {
        button.addEventListener('click', () => {
            const current = Number(button.dataset.checkoutNext);
            if (current === 1) {
                if (!validateDeliveryData()) return;
                setCheckoutStep(2);
                return;
            }

            if (current === 2) {
                if (!validatePayment()) return;
                renderCheckoutReview();
                setCheckoutStep(3);
            }
        });
    });

    document.querySelectorAll('[data-checkout-back]').forEach((button) => {
        button.addEventListener('click', () => {
            const current = Number(button.dataset.checkoutBack);
            setCheckoutStep(Math.max(1, current - 1));
        });
    });

    confirmOrderButton?.addEventListener('click', () => {
        if (cart.size === 0) return;
        if (!validateDeliveryData() || !validatePayment()) return;

        saveProfileFromCheckout();

        const pendingOrder = buildPendingOrder();
        pendingOrder.updatedAt = new Date().toISOString();
        savePendingOrder(pendingOrder);
        editingPendingOrder = false;

        const pendingOrderNumber = document.getElementById('pendingOrderNumber');
        if (pendingOrderNumber) pendingOrderNumber.textContent = pendingOrder.number;

        setCheckoutStep(4);
        cart.clear();
        renderCart();
        renderPendingOrder(pendingOrder);
    });

    finishCheckoutButton?.addEventListener('click', () => {
        closeCheckout();
        setCheckoutStep(1);
        checkoutForm?.reset();
        clearCheckoutErrors();
        editingPendingOrder = false;
        showHomeView();
    });

    checkoutForm?.addEventListener('input', (event) => {
        const field = event.target.closest('.checkout-field');
        if (!field) return;
        field.classList.remove('has-error');
        field.querySelector('.checkout-error')?.replaceChildren();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;

        if (checkoutModal?.classList.contains('is-open')) {
            closeCheckout();
            return;
        }

        if (pendingOrderModal?.classList.contains('is-open')) {
            closePendingOrder();
            return;
        }

        if (orderUpdateModal?.classList.contains('is-open')) {
            closeOrderUpdateConfirmation();
            return;
        }

        if (newOrderConfirmationModal?.classList.contains('is-open')) {
            closeNewOrderConfirmation();
            return;
        }

        if (accountModal?.classList.contains('is-open')) {
            closeAccount();
        }
    });


    // =========================================================
    // NAVEGACIÓN DE CATEGORÍAS
    // =========================================================
    const homeView = document.getElementById('homeView');
    const beveragesView = document.getElementById('bebidasView');
    const pantryView = document.getElementById('almacenView');
    const snacksView = document.getElementById('snacksView');
    const dairyView = document.getElementById('lacteosView');
    const cleaningView = document.getElementById('limpiezaView');
    const offersView = document.getElementById('ofertasView');
    const categoryLinks = [...document.querySelectorAll('[data-category-target]')];

    const views = {
        bebidas: beveragesView,
        almacen: pantryView,
        snacks: snacksView,
        lacteos: dairyView,
        limpieza: cleaningView,
        ofertas: offersView
    };

    const setActiveCategory = (target) => {
        document.querySelectorAll('.category-nav a[data-category-target]').forEach((navLink) => {
            navLink.classList.toggle('active', navLink.dataset.categoryTarget === target);
        });
    };

    // =========================================================
    // HERO SLIDER
    // =========================================================
    const heroSlider = document.querySelector('[data-hero-slider]');
    const heroTrack = heroSlider?.querySelector('[data-hero-track]');
    const heroSlides = [...(heroSlider?.querySelectorAll('[data-hero-slide]') || [])];
    const heroDots = [...(heroSlider?.querySelectorAll('[data-hero-dot]') || [])];
    const heroPrevButton = heroSlider?.querySelector('[data-hero-prev]');
    const heroNextButton = heroSlider?.querySelector('[data-hero-next]');
    let heroSlideIndex = 0;
    let heroAutoTimer = null;

    const setHeroSlide = (index, { restartTimer = true } = {}) => {
        if (!heroSlides.length || !heroTrack) return;

        heroSlideIndex = (index + heroSlides.length) % heroSlides.length;
        heroTrack.style.transform = `translateX(-${heroSlideIndex * 100}%)`;

        heroSlides.forEach((slide, slideIndex) => {
            const active = slideIndex === heroSlideIndex;
            slide.classList.toggle('is-active', active);
            slide.setAttribute('aria-hidden', String(!active));
        });

        heroDots.forEach((dot, dotIndex) => {
            const active = dotIndex === heroSlideIndex;
            dot.classList.toggle('is-active', active);
            dot.setAttribute('aria-selected', String(active));
        });

        if (restartTimer) startHeroAutoPlay();
    };

    const startHeroAutoPlay = () => {
        if (heroSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        window.clearInterval(heroAutoTimer);
        heroAutoTimer = window.setInterval(() => {
            setHeroSlide(heroSlideIndex + 1, { restartTimer: false });
        }, 9000);
    };

    const stopHeroAutoPlay = () => {
        window.clearInterval(heroAutoTimer);
        heroAutoTimer = null;
    };

    if (heroSlides.length) {
        setHeroSlide(0, { restartTimer: false });
        heroPrevButton?.addEventListener('click', () => setHeroSlide(heroSlideIndex - 1));
        heroNextButton?.addEventListener('click', () => setHeroSlide(heroSlideIndex + 1));
        heroDots.forEach((dot) => {
            dot.addEventListener('click', () => {
                setHeroSlide(Number(dot.dataset.heroDot));
            });
        });
        heroSlider?.addEventListener('mouseenter', stopHeroAutoPlay);
        heroSlider?.addEventListener('mouseleave', startHeroAutoPlay);
        heroSlider?.addEventListener('focusin', stopHeroAutoPlay);
        heroSlider?.addEventListener('focusout', (event) => {
            if (!heroSlider.contains(event.relatedTarget)) startHeroAutoPlay();
        });
        startHeroAutoPlay();
    }

    const hideSuggestions = () => {
        document.querySelector('.search-suggestions')?.setAttribute('hidden', '');
    };

    const showHomeView = ({ resetSearch = true } = {}) => {
        if (resetSearch) resetSearchFilter();
        document.body.classList.remove('category-mode');
        if (homeView) homeView.hidden = false;

        Object.values(views).forEach((view) => {
            if (view) view.hidden = true;
        });

        setActiveCategory('home');
        updateSubcategoryIndexVisibility('home');
        hideSuggestions();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showCategoryView = (viewName, { resetSearch = true } = {}) => {
        const selectedView = views[viewName];
        if (!selectedView) return;

        if (resetSearch) resetSearchFilter();
        document.body.classList.add('category-mode');
        if (homeView) homeView.hidden = true;

        Object.entries(views).forEach(([name, view]) => {
            if (view) view.hidden = name !== viewName;
        });

        setActiveCategory(viewName);
        updateSubcategoryIndexVisibility(viewName);
        hideSuggestions();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    categoryLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = link.dataset.categoryTarget;
            if (!target) return;

            event.preventDefault();

            if (target === 'home') {
                showHomeView();
            } else {
                showCategoryView(target);
            }
        });
    });

    document.querySelectorAll('.category-back').forEach((button) => {
        button.addEventListener('click', showHomeView);
    });

    // =========================================================
    // ÍNDICE RÁPIDO DE SUBCATEGORÍAS
    // =========================================================
    const subcategoryIndexes = new Map();
    const subcategoryObservers = new Map();

    const slugify = (text) => String(text)
        .toLocaleLowerCase('es-AR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const ensureUniqueId = (baseId, usedIds) => {
        let id = baseId || 'subcategoria';
        let suffix = 2;
        while (usedIds.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
        }
        usedIds.add(id);
        return id;
    };

    const createSubcategoryIndex = (view) => {
        if (!view) return;

        const existingIndex = view.querySelector('.subcategory-index');
        if (existingIndex) existingIndex.remove();

        const sections = [...view.querySelectorAll('.subcategory-section')];
        if (!sections.length) return;

        const usedIds = new Set();
        const nav = document.createElement('nav');
        nav.className = 'subcategory-index';
        nav.setAttribute('aria-label', 'Ir a una subcategoría');

        const label = document.createElement('div');
        label.className = 'subcategory-index-label';
        label.textContent = 'SECCIONES';
        nav.appendChild(label);

        const buttons = [];

        sections.forEach((section, index) => {
            const title = section.querySelector('.subcategory-heading h3')?.textContent.trim() || `Sección ${index + 1}`;
            const id = ensureUniqueId(
                `${view.id.replace(/View$/, '')}-${slugify(title) || `seccion-${index + 1}`}`,
                usedIds
            );
            section.id = id;

            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = title;
            button.dataset.targetId = id;
            button.setAttribute('aria-label', `Ir a ${title}`);

            button.addEventListener('click', () => {
                const target = document.getElementById(id);
                if (!target) return;
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                buttons.forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
            });

            nav.appendChild(button);
            buttons.push(button);
        });

        view.querySelector('.category-hero-heading')?.after(nav);
        subcategoryIndexes.set(view, { nav, buttons, sections });

        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

            if (!visible) return;

            const activeIndex = sections.indexOf(visible.target);
            if (activeIndex < 0) return;

            buttons.forEach((button, index) => {
                button.classList.toggle('active', index === activeIndex);
            });

            buttons[activeIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }, {
            root: null,
            rootMargin: '-120px 0px -55% 0px',
            threshold: 0.01
        });

        sections.forEach((section) => observer.observe(section));
        subcategoryObservers.set(view, observer);

        buttons[0]?.classList.add('active');
    };

    Object.values(views).forEach(createSubcategoryIndex);

    const updateSubcategoryIndexVisibility = (viewName) => {
        subcategoryIndexes.forEach(({ nav }, view) => {
            nav.hidden = !view || view !== views[viewName];
        });
    };



    updateSubcategoryIndexVisibility('home');

    // =========================================================
    // BUSCADOR
    // =========================================================
    const searchInput = document.getElementById('search');
    const searchButton = document.querySelector('.search-wrap button');
    const viewToggle = document.querySelector('.view-toggle');
    const featuredProductGrid = document.querySelector('.products-section .product-grid:not(.catalog-grid)');
    const catalogGrid = document.getElementById('catalogGrid');
    const catalogFilterButton = document.getElementById('catalogFilterButton');
    const catalogFilterPanel = document.getElementById('catalogFilterPanel');
    const catalogSort = document.getElementById('catalogSort');
    const catalogCategory = document.getElementById('catalogCategory');
    const catalogPromotions = document.getElementById('catalogPromotions');
    const catalogAvailable = document.getElementById('catalogAvailable');
    const catalogEmpty = document.getElementById('catalogEmpty');
    const catalogResultsFooter = document.getElementById('catalogResultsFooter');
    const catalogResultCount = document.getElementById('catalogResultCount');
    const showMoreProductsButton = document.getElementById('showMoreProducts');
    const featuredEyebrow = document.querySelector('.products-heading .eyebrow');
    const featuredHeading = document.querySelector('.products-heading h2');
    let catalogMode = false;
    let visibleCatalogCount = 20;

    viewToggle?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-view]');
        if (!button) return;

        const isList = button.dataset.view === 'list';
        [featuredProductGrid, catalogGrid].forEach((grid) => {
            grid?.classList.toggle('is-list', isList);
        });

        viewToggle.querySelectorAll('button[data-view]').forEach((option) => {
            const isSelected = option === button;
            option.classList.toggle('selected', isSelected);
            option.setAttribute('aria-pressed', String(isSelected));
        });
    });

    const normalizeCatalogCategory = (category) =>
        category === 'Limpieza' ? categoryNames.limpieza : category;

    [...new Set([...products.values()].map((product) => normalizeCatalogCategory(product.category)))]
        .sort((a, b) => a.localeCompare(b, 'es-AR'))
        .forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            catalogCategory?.appendChild(option);
        });

    const catalogIllustrations = {
        'product-red': 'can-red',
        'product-blue': 'bottle-blue',
        'product-gold': 'chips',
        'product-green': 'soap',
        'product-purple': 'cookies',
        'product-orange': 'pasta',
        'product-brown': 'coffee',
        'product-pink': 'shampoo',
    };

    const createCatalogCard = (product) => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        card.dataset.price = String(product.price);
        if (!product.available) card.dataset.outOfStock = 'true';

        const image = document.createElement('div');
        const imageClass = Object.hasOwn(catalogIllustrations, product.imageClass)
            ? product.imageClass
            : 'product-blue';
        image.className = `product-image ${imageClass}`;

        if (product.offer) {
            const offerTag = document.createElement('span');
            offerTag.className = 'offer-tag';
            offerTag.textContent = 'OFERTA';
            image.appendChild(offerTag);
        }

        const illustration = document.createElement('div');
        illustration.className = `product-illustration ${catalogIllustrations[imageClass]}`;
        const illustrationLabel = document.createElement('span');
        illustrationLabel.textContent = product.name.split(/\s+/)[0].slice(0, 12).toLocaleUpperCase('es-AR');
        illustration.appendChild(illustrationLabel);
        image.appendChild(illustration);

        const body = document.createElement('div');
        body.className = 'product-body';

        const category = document.createElement('span');
        category.className = 'product-category';
        category.textContent = normalizeCatalogCategory(product.category);

        const name = document.createElement('h3');
        name.textContent = product.name;

        const code = document.createElement('p');
        code.className = 'product-code';
        code.textContent = `Cód. ${product.id}`;

        const meta = document.createElement('div');
        meta.className = 'product-meta';
        const availability = document.createElement('span');
        availability.className = product.available ? 'in-stock' : 'out-stock';
        availability.textContent = product.available ? '● Disponible' : '● Sin stock';
        meta.appendChild(availability);
        const subcategory = document.createElement('span');
        subcategory.textContent = product.subcategory;
        meta.appendChild(subcategory);

        const bottom = document.createElement('div');
        bottom.className = 'product-bottom';
        const price = document.createElement('div');
        const priceLabel = document.createElement('small');
        priceLabel.textContent = 'Precio';
        const priceValue = document.createElement('strong');
        priceValue.textContent = money(product.price);
        price.append(priceLabel, priceValue);

        const addButton = document.createElement('button');
        addButton.className = 'add-button';
        addButton.type = 'button';
        addButton.textContent = '+';
        addButton.disabled = !product.available;
        addButton.setAttribute('aria-label', product.available
            ? `Agregar ${product.name}`
            : `${product.name} sin stock`
        );
        if (!product.available) addButton.classList.add('disabled');
        bottom.append(price, addButton);

        body.append(category, name, code, meta, bottom);
        card.append(image, body);
        return card;
    };

    const getFilteredCatalog = () => {
        const selectedCategory = catalogCategory?.value || '';
        const onlyPromotions = Boolean(catalogPromotions?.checked);
        const onlyAvailable = Boolean(catalogAvailable?.checked);
        const sortOrder = catalogSort?.value || 'recommended';
        const filtered = [...products.values()].filter((product) => {
            if (selectedCategory && normalizeCatalogCategory(product.category) !== selectedCategory) return false;
            if (onlyPromotions && !product.offer) return false;
            if (onlyAvailable && !product.available) return false;
            return true;
        });

        if (sortOrder === 'price-asc') filtered.sort((a, b) => a.price - b.price);
        if (sortOrder === 'price-desc') filtered.sort((a, b) => b.price - a.price);
        if (sortOrder === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));
        return filtered;
    };

    const renderCatalog = () => {
        const filtered = getFilteredCatalog();
        const visible = filtered.slice(0, visibleCatalogCount);
        catalogGrid?.replaceChildren(...visible.map(createCatalogCard));

        if (catalogResultCount) {
            catalogResultCount.textContent = `Mostrando ${visible.length} de ${filtered.length} productos`;
        }
        if (catalogEmpty) catalogEmpty.hidden = filtered.length > 0;
        if (showMoreProductsButton) {
            const remaining = filtered.length - visible.length;
            showMoreProductsButton.hidden = remaining <= 0;
            showMoreProductsButton.textContent = 'Mostrar más';
        }
    };

    const enterCatalogMode = () => {
        catalogMode = true;
        visibleCatalogCount = 20;
        if (featuredProductGrid) featuredProductGrid.hidden = true;
        if (catalogGrid) catalogGrid.hidden = false;
        if (catalogResultsFooter) catalogResultsFooter.hidden = false;
        if (catalogFilterPanel) catalogFilterPanel.hidden = false;
        if (catalogFilterButton) {
            catalogFilterButton.textContent = 'Volver a productos destacados';
            catalogFilterButton.setAttribute('aria-controls', 'catalogGrid');
            catalogFilterButton.removeAttribute('aria-expanded');
        }
        if (featuredEyebrow) featuredEyebrow.textContent = 'CATÁLOGO COMPLETO';
        if (featuredHeading) featuredHeading.textContent = 'Todos los productos';
        renderCatalog();
    };

    catalogFilterButton?.addEventListener('click', () => {
        if (catalogMode) {
            catalogMode = false;
            if (featuredProductGrid) featuredProductGrid.hidden = false;
            if (catalogGrid) catalogGrid.hidden = true;
            if (catalogFilterPanel) catalogFilterPanel.hidden = true;
            if (catalogResultsFooter) catalogResultsFooter.hidden = true;
            catalogFilterButton.textContent = '☷ Filtrar y ordenar';
            catalogFilterButton.setAttribute('aria-controls', 'catalogFilterPanel');
            catalogFilterButton.setAttribute('aria-expanded', 'false');
            if (featuredEyebrow) featuredEyebrow.textContent = 'PRODUCTOS DESTACADOS';
            if (featuredHeading) featuredHeading.textContent = 'Lo más pedido';
            return;
        }

        enterCatalogMode();
    });

    [catalogSort, catalogCategory, catalogPromotions, catalogAvailable].forEach((control) => {
        control?.addEventListener('change', () => {
            visibleCatalogCount = 20;
            renderCatalog();
        });
    });

    document.getElementById('resetCatalogFilters')?.addEventListener('click', () => {
        if (catalogSort) catalogSort.value = 'recommended';
        if (catalogCategory) catalogCategory.value = '';
        if (catalogPromotions) catalogPromotions.checked = false;
        if (catalogAvailable) catalogAvailable.checked = false;
        visibleCatalogCount = 20;
        renderCatalog();
    });

    showMoreProductsButton?.addEventListener('click', () => {
        visibleCatalogCount += 20;
        renderCatalog();
    });

    const normalizeText = (text) =>
        text
            .toLocaleLowerCase('es-AR')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const levenshtein = (a, b) => {
        if (a === b) return 0;
        if (!a) return b.length;
        if (!b) return a.length;

        let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

        for (let i = 0; i < a.length; i += 1) {
            const current = [i + 1];

            for (let j = 0; j < b.length; j += 1) {
                const insert = current[j] + 1;
                const remove = previous[j + 1] + 1;
                const replace = previous[j] + (a[i] === b[j] ? 0 : 1);
                current.push(Math.min(insert, remove, replace));
            }

            previous = current;
        }

        return previous[b.length];
    };

    const damerauLevenshtein = (a, b) => {
        const distance = levenshtein(a, b);

        for (let index = 0; index < Math.min(a.length, b.length) - 1; index += 1) {
            if (a[index] === b[index + 1] && a[index + 1] === b[index]) {
                return Math.min(distance, 1 + Math.abs(a.length - b.length));
            }
        }

        return distance;
    };

    const wordSimilarity = (queryWord, productWord) => {
        if (!queryWord || !productWord) return 0;
        if (queryWord.length <= 2 || productWord.length <= 2) {
            return queryWord === productWord ? 1 : 0;
        }
        if (productWord.includes(queryWord) || queryWord.includes(productWord)) return 1;

        const distance = damerauLevenshtein(queryWord, productWord);
        return 1 - distance / Math.max(queryWord.length, productWord.length);
    };

    const getSearchFields = (card) => {
        const product = products.get(card.dataset.productId);
        const cardText = card.textContent || '';

        // El buscador utiliza tanto el texto visible de la tarjeta como los
        // datos canónicos del producto. Así también puede encontrar productos
        // por categoría, subcategoría o código aunque solo aparezcan en una vista.
        return {
            name: normalizeText(product?.name || ''),
            metadata: normalizeText(product
                ? [product.category, product.subcategory, product.id].filter(Boolean).join(' ')
                : ''),
            visible: normalizeText(cardText),
        };
    };

    const productMatchesQuery = (card, query) => {
        if (!query) return true;

        const name = normalizeText(getCardProductName(card));
        const visible = normalizeText(card.textContent || '');
        if (name.includes(query) || visible.includes(query)) return true;

        const queryWords = query.split(/\s+/).filter(Boolean);
        const productWords = name.split(/[^a-z0-9]+/i).filter(Boolean);
        if (!productWords.length) return false;

        return queryWords.every((queryWord) => {
            const bestScore = productWords.reduce(
                (best, productWord) => Math.max(best, wordSimilarity(queryWord, productWord)),
                0
            );

            const threshold = 0.75;
            return bestScore >= threshold;
        });
    };

    const getSearchScore = (card, query) => {
        if (!query) return 0;

        const { name, metadata, visible } = getSearchFields(card);
        if (name === query) return 1.2;
        if (name.includes(query)) return 1.1;
        if (metadata.includes(query)) return 1;
        if (visible.includes(query)) return 0.95;

        const queryWords = query.split(/\s+/).filter(Boolean);
        const productWords = name.split(/[^a-z0-9]+/i).filter(Boolean);
        if (!queryWords.length || !productWords.length) return 0;

        const scores = queryWords.map((queryWord) => {
            return productWords.reduce(
                (best, productWord) => Math.max(best, wordSimilarity(queryWord, productWord)),
                0
            );
        });

        const nameScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return nameScore * 0.9;
    };

    const searchWrap = document.querySelector('.search-wrap');
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    suggestions.hidden = true;
    searchWrap?.appendChild(suggestions);

    const hideSearchSuggestions = () => {
        suggestions.hidden = true;
        suggestions.innerHTML = '';
    };

    const renderSuggestions = () => {
        const query = normalizeText(searchInput?.value.trim() || '');
        if (!query) {
            hideSearchSuggestions();
            return;
        }

        const uniqueCards = new Map();
        allProductCards.forEach((card) => {
            const id = card.dataset.productId;
            if (id && !uniqueCards.has(id)) uniqueCards.set(id, card);
        });

        const ranked = [...uniqueCards.values()]
            .map((card) => ({ card, score: getSearchScore(card, query) }))
            .filter(({ card, score }) => score >= 0.48 && productMatchesQuery(card, query))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (!ranked.length) {
            hideSearchSuggestions();
            return;
        }

        suggestions.innerHTML = ranked.map(({ card }) => {
            const id = card.dataset.productId;
            const product = products.get(id);
            if (!product) return '';

            return `
                <button type="button" class="search-suggestion" data-suggestion-id="${id}">
                    <span class="suggestion-icon">🔎</span>
                    <span class="suggestion-text">
                        <strong>${product.name}</strong>
                        <small>${product.category} · ${money(product.price)}</small>
                    </span>
                </button>`;
        }).join('');

        suggestions.hidden = false;
    };

    const clearSearchFocus = () => {
        allProductCards.forEach((card) => card.classList.remove('search-focus'));
    };

    const getUniqueCatalogCards = () => {
        const uniqueCards = new Map();

        allProductCards.forEach((card) => {
            const id = card.dataset.productId;
            if (id && !uniqueCards.has(id)) uniqueCards.set(id, card);
        });

        return [...uniqueCards.values()];
    };

    const getFirstCatalogResult = (query) => {
        return getUniqueCatalogCards().find((card) => productMatchesQuery(card, query));
    };

    const resetSearchFilter = () => {
        if (searchInput) searchInput.value = '';
        allProductCards.forEach((card) => {
            card.hidden = false;
        });
        hideSearchSuggestions();
    };

    const showCardResult = (card) => {
        if (!card) return;

        const view = card.closest('.category-view');
        if (view) {
            const viewName = Object.entries(views).find(([, element]) => element === view)?.[0];
            if (viewName) showCategoryView(viewName, { resetSearch: false });
        } else {
            showHomeView({ resetSearch: false });
        }

        clearSearchFocus();
        card.hidden = false;
        card.classList.add('search-focus');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });

        window.setTimeout(() => card.classList.remove('search-focus'), 1400);
    };

    const filterProducts = ({ focusResult = false } = {}) => {
        const query = normalizeText(searchInput?.value.trim() || '');

        // La búsqueda ya no filtra ni oculta productos.
        // Mientras escribís, todo el catálogo permanece visible; las sugerencias
        // siguen mostrando coincidencias y, al confirmar, se lleva al usuario
        // directamente al primer resultado.
        allProductCards.forEach((card) => {
            card.hidden = false;
        });

        if (focusResult && query) {
            const first = getFirstCatalogResult(query);
            if (first) showCardResult(first);
        }
    };

    suggestions.addEventListener('click', (event) => {
        const option = event.target.closest('[data-suggestion-id]');
        if (!option) return;

        const id = option.dataset.suggestionId;
        const card = allProductCards.find((item) => item.dataset.productId === id);
        if (!card) return;

        const product = products.get(id);
        if (searchInput && product) searchInput.value = product.name;
        hideSearchSuggestions();
        showCardResult(card);
    });

    searchInput?.addEventListener('input', () => {
        filterProducts();
        renderSuggestions();
    });

    searchInput?.addEventListener('focus', renderSuggestions);

    const confirmSearch = () => {
        hideSearchSuggestions();
        filterProducts({ focusResult: true });
    };

    searchButton?.addEventListener('click', confirmSearch);

    searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            confirmSearch();
        }

        if (event.key === 'Escape') {
            hideSearchSuggestions();
        }
    });

    document.addEventListener('click', (event) => {
        if (!searchWrap?.contains(event.target)) hideSearchSuggestions();
    });

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================
    // Deshabilita las tarjetas de categoría que apunten a un producto sin stock.
    document.querySelectorAll('.category-product-card').forEach((card) => {
        const product = products.get(card.dataset.productId);
        const button = card.querySelector('.category-add');
        if (button && product && !product.available) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    });

    // Estado inicial de búsqueda, carrito y pedido pendiente.
    renderCart();
    updatePendingOrderIndicator();
    updateAccountIndicator();
})();
