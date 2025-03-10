import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import IngredientRow from '../component/IngredientRow';
import logout_logo from "../image/logout.png";
import receipt_logo from "../image/receipt_logo.png";
import ExecuteAPI from '../util/ExecuteAPI';

const Ingredients = (props) => {
    // 食材情報
    const [ingredients, setIngredients] = useState([]);
    // レシートから取得した食材情報
    const [modalIngredients, setModalIngredients] = useState([]);
    // 編集中の食材のインデックス
    const [editingIndex, setEditingIndex] = useState(null);
    // モーダル内で編集中の食材のインデックス
    const [modalEditingIndex, setModalEditingIndex] = useState(null);
    // 削除確認モーダルの表示
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // レシートからの食材追加モーダルの表示
    const [showModal, setshowModal] = useState(false);
    // 削除対象の食材
    const [ingredientToDelete, setIngredientToDelete] = useState(null);
    // モーダル内で削除対象の食材
    const [modalIngredientToDelete, setModalIngredientToDelete] = useState(null);
    // メッセージ
    const [message, setMessage] = useState({type: "", message: ""});
    // レシートスキャン中かどうか
    const [scanning, setScanning] = useState(false);
    // レシート画像の参照
    const imageInputRef = useRef(null);
    // ユーザー名
    const name = props.name;
    const navigate = useNavigate();
    const accessToken = localStorage.getItem('accessToken');

    // セッションが切れた場合の処理
    const session_expired = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('kitchenCompassUserName');
        navigate('/', { state: {error: "セッションが切れています" }} );
    }

    // アクセストークンがない場合の処理
    if (!accessToken) {
        session_expired();
    }

    // 食材情報を取得
    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams({
                    username: name
                });
                const response = await ExecuteAPI(
                    params, 
                    "GET", 
                    {
                        'Content-Type': 'application/json',
                        'authorization': accessToken
                    }, 
                    "", 
                    "/ingredient"
                );
                if (response.status === 401) {
                    session_expired();
                }
                if (!response.ok) {
                    throw new Error();
                }
                const result = await response.json();
                setIngredients(result.ingredients);
            }
            catch (error) {
                setMessage({
                    type: "error",
                    message: "Failed to get ingredients"
                });
            }
        };
        fetchData();
    }, []);

    // ログアウト処理
    const Logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('kitchenCompassUserName');
        navigate('/');
    };

    
    // 食材情報を更新
    const SaveIngredient = async (index, updatedIngredient) => {
        resetMessage();
        const result = checkIngredient(updatedIngredient);
        if (!result) {  return; }
        try {
            const body = JSON.stringify({
                username: name,
                ingredients: [updatedIngredient]
            })
            const response = await ExecuteAPI(
                "", 
                "POST", 
                {
                    'Content-Type': 'application/json',
                    'authorization': accessToken
                }, 
                body, 
                "/ingredient"
            );
            if (response.status === 401) {
                session_expired();
            }
            if (!response.ok) {
                throw new Error();
            }
            const updatedIngredients = [...ingredients];
            updatedIngredients[index] = updatedIngredient;
            setIngredients(updatedIngredients);
            setEditingIndex(null);
            return
        }
        catch (error) {
            setMessage({
                type: "error",
                message: "Failed to update ingredient"
            });
            return
        }
    };

    // 食材情報のバリデーション
    const checkIngredient = (ingredient) => {
        if (ingredient.name === "") {
            setMessage({
                type: "error",
                message: "Name is required"
            });
            return false;
        }
        if (ingredient.amount === "") {
            setMessage({
                type: "error",
                message: "Amount is required"
            });
            return false;
        }
        if (ingredient.unit === "") {
            setMessage({
                type: "error",
                message: "Unit is required"
            });
            return  false;
        }
        if (ingredient.deadline === "") {
            setMessage({
                type: "error",
                message: "Deadline is required"
            });
            return  false;
        }
        setMessage({
            type: "success",
            message: "Ingredient updated successfully"
        });
        return true;
    };

    // メッセージをリセット
    const resetMessage = () => {
        setMessage({
            type: "",
            message: ""
        });
    };

    // モーダル内の食材情報を更新
    const SaveModalIngredient = (index, updatedIngredient) => {
        resetMessage();
        const result = checkIngredient(updatedIngredient);
        if (!result) {  return; }
        const updatedIngredients = [...modalIngredients];
        updatedIngredients[index] = updatedIngredient;
        setModalIngredients(updatedIngredients);
        setModalEditingIndex(null);
    };

    // モーダル内の食材情報を登録
    const registerIngredientFromModal = async () => {
        resetMessage();
        for (const ingredient of modalIngredients) {
            const result = checkIngredient(ingredient);
            if (!result) {  return; }
        }
        try {
            const body = JSON.stringify({
                username: name,
                ingredients: [...modalIngredients]
            })
            const response = await ExecuteAPI(
                "", 
                "POST", 
                {
                    'Content-Type': 'application/json',
                    'authorization': accessToken
                }, 
                body, 
                "/ingredient"
            );
            if (response.status === 401) {
                session_expired();
            }
            if (!response.ok) {
                throw new Error();
            }
            const updatedIngredients = [...ingredients, ...modalIngredients];
            setIngredients(updatedIngredients);
            setModalEditingIndex(null);
            setshowModal(false);
            return
        }
        catch (error) {
            setMessage({
                type: "error",
                message: "Failed to update ingredient"
            });
            return
        }
    };

    // 食材削除
    const DeleteIngredient = (ingredient) => {
        setIngredientToDelete(ingredient);
        setShowDeleteModal(true);
    };

    // モーダル内の食材削除
    const DeleteModalIngredient = (ingredient) => {
        setModalIngredientToDelete(ingredient);
        setShowDeleteModal(true);
    };
    
    // 食材削除確認
    const confirmDeleteIngredient = async () => {
        resetMessage();
        try {
            const body = JSON.stringify({
                username: name,
                ingredients: [ingredientToDelete]
            })
            const response = await ExecuteAPI(
                "", 
                "DELETE", 
                {
                    'Content-Type': 'application/json',
                    'authorization': accessToken
                }, 
                body, 
                "/ingredient"
            );
            if (response.status === 401) {
                session_expired();
            }
            if (!response.ok) {
                throw new Error();
            }
            setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToDelete));
            setShowDeleteModal(false);
            setIngredientToDelete(null);
            return
        }
        catch (error) {
            setMessage({
                type: "error",
                message: "Failed to delete"
            });
            return
        }
    };

    // モーダル内の食材削除確認
    const confirmDeleteModalIngredient = () => {
        resetMessage();
        setModalIngredients(modalIngredients.filter(ingredient => ingredient !== modalIngredientToDelete));
        setShowDeleteModal(false);
        setModalIngredientToDelete(null);
    };

    // レシート画像から食材を取得
    const OnFileInputChange = async (e) => {
        resetMessage();
        setScanning(true);
        const file = e.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('receipt', file);
                const response = await ExecuteAPI(
                    "", 
                    "POST", 
                    {
                        'authorization': accessToken
                    }, 
                    formData, 
                    "/ingredient/extract"
                );
                if (response.status === 401) {
                    session_expired();
                }
    
                if (!response.ok) {
                    throw new Error('Failed to extract ingredients from receipt');
                }
    
                const result = await response.json();

                // 最大のIDを取得
                const maxId = Math.max(...ingredients.map(ingredient => ingredient.id));
                let id = maxId + 1;

                const receiptIngredients = result.ingredients.map((ingredient) => {
                    return {
                        name: ingredient.name,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        deadline: "",
                        id: id++
                    };
                });
                setModalIngredients(receiptIngredients);
                setshowModal(true);
            } catch (error) {
                setMessage({
                    type: "error",
                    message: error.message
                });
            } finally {
                setScanning(false);
                e.target.value = null;
            }
        } else {
            setScanning(false);
            e.target.value = null;
        }
    };

    // ファイルアップロード
    const FileUpload = () => {
        imageInputRef.current.click();
    }

    // 食材追加
    const AddIngredient = () => {
        // 食材数を取得
        const ingredientCount = ingredients.length;
        setEditingIndex(ingredientCount);
        // 使用されているIDを取得
        const usedIds = new Set(ingredients.map(ingredient => ingredient.id));

        // 最小の空いているIDを探す
        let id = 0;
        while (usedIds.has(id)) {
            id++;
        }
        setIngredients([...ingredients, { name: "", amount: "", unit: "", deadline: "", id: id }]);
    }

    return (
        <div className="grow p-10 md:ml-[8%]">
            <div>
                <h1 className="text-3xl font-bold">Ingredients</h1>
                {/* レシートスキャンボタン */}
                <button onClick={FileUpload} className="mt-5 ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center">
                    <img className="fill-current w-4 h-4 mr-2" src={receipt_logo} alt="Scan Receipt" />
                    <span>Scan Receipt</span>
                </button>
                <input
                    name="receipt"
                    hidden
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={OnFileInputChange}
                />
                <div className="mt-10 ml-2 flex w-full">
                    <div className="flex flex-col w-full">
                        <div className="w-full">
                            <div className="border-b border-gray-200 shadow w-full">
                            <div className={`${showModal ? 'hidden' : ''} font-bold font-KonkhmerSleokchher ${message.type == "error" ? 'text-rose-600' : 'text-emerald-400'}`}>
                                {message.message}
                            </div>
                            {/* 食材一覧 */}
                            <div className="overflow-x-auto">
                                <table className="divide-y divide-zinc-950 w-full">
                                    <thead className="bg-orange-500">
                                        <tr>
                                            <th className="w-full px-6 py-2 text-sm text-left text-slate-950">Name</th>
                                            <th className="w-full px-6 py-2 text-xs text-left text-slate-950">Amount</th>
                                            <th className="w-full px-6 py-2 text-xs text-left text-slate-950">Unit</th>
                                            <th className="w-full px-6 py-2 text-xs text-left text-slate-950">Deadline</th>
                                            <th className="w-full px-6 py-2 text-xs text-left text-slate-950">Edit</th>
                                            <th className="w-full px-6 py-2 text-xs text-left text-slate-950">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-orange-100 divide-y divide-gray-300">
                                        {ingredients.map((ingredient, index) => (
                                            <IngredientRow
                                                key={index}
                                                index={index}
                                                ingredient={ingredient}
                                                isEditing={editingIndex === index}
                                                EditIngredient={() => setEditingIndex(index)}
                                                SaveIngredient={SaveIngredient}
                                                DeleteIngredient={() => DeleteIngredient(ingredient)}
                                                editingIndex = {editingIndex}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            </div>
                            {/* 食材追加ボタン */}
                            <div className="flex justify-end">
                                <button onClick={AddIngredient} className="mt-5 mr-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-orange-300 dark:focus:ring-orange-800 font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50" disabled={editingIndex!==null}>
                                        <span>Add Ingredient</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ログアウトロゴを画面右上に配置 */}
            <div className="fixed top-2 right-2 m-4 flex items-center cursor-pointer" onClick={Logout}>
                <img
                    src={logout_logo}
                    alt="Logout"
                    className="w-8 h-8"
                />
                <span className="ml-2 text-lg font-bold">Log out</span>
            </div>
            {/* レシートからの食材追加モーダル */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="max-h-[90vh] overflow-y-auto bg-white p-6 rounded shadow-lg">
                        <div className="border-b border-gray-200 shadow w-full">
                            <div className={`font-bold font-KonkhmerSleokchher ${message.type == "error" ? 'text-rose-600' : 'text-emerald-400'}`}>
                                {message.message}
                            </div>
                            <table className="divide-y divide-zinc-950 w-full">
                                <thead className="bg-orange-500">
                                    <tr>
                                        <th className="px-6 py-2 text-sm text-left text-slate-950">Name</th>
                                        <th className="px-6 py-2 text-xs text-left text-slate-950">Amount</th>
                                        <th className="px-6 py-2 text-xs text-left text-slate-950">Unit</th>
                                        <th className="px-6 py-2 text-xs text-left text-slate-950">Deadline</th>
                                        <th className="px-6 py-2 text-xs text-left text-slate-950">Edit</th>
                                        <th className="px-6 py-2 text-xs text-left text-slate-950">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-orange-100 divide-y divide-gray-300">
                                    {modalIngredients.map((ingredient, index) => (
                                        <IngredientRow
                                            key={index}
                                            index={index}
                                            ingredient={ingredient}
                                            isEditing={modalEditingIndex === index}
                                            EditIngredient={() => setModalEditingIndex(index)}
                                            SaveIngredient={SaveModalIngredient}
                                            DeleteIngredient={() => DeleteModalIngredient(ingredient)}
                                            editingIndex = {modalEditingIndex}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                                onClick={() => setshowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-zinc-900 hover:bg-zinc-950 text-white font-bold py-2 px-4 rounded"
                                onClick={registerIngredientFromModal}
                            >
                                register
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 削除確認モーダル */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                        <p>Are you sure you want to delete this ingredient?</p>
                        <div className="mt-4 flex justify-end">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                onClick={ showModal ? confirmDeleteModalIngredient : confirmDeleteIngredient}
                            >
                                delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* レシートスキャン中モーダル */}
            {scanning && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="flex flex-col items-center">
                    <div className="animate-bounce bg-white p-6 rounded shadow-lg mt-4">
                        <h2 className="text-xl font-bold mb-4">Scanning...</h2>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default Ingredients;